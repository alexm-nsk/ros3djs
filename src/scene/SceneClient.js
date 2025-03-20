/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A marker client that listens to a given marker topic.
 *
 * Emits the following events:
 *
 *  * 'change' - there was an update or change in the marker
 *
 * @constructor
 * @param options - object with following keys:
 *
 *   * ros - the ROSLIB.Ros connection handle
 *   * topic - the marker topic to listen to
 *   * tfClient - the TF client handle to use
 *   * rootObject (optional) - the root object to add this marker to
 *   * path (optional) - the base path to any meshes that will be loaded
 *   * lifetime - the lifetime of marker
 */
ROS3D.SceneClient = function(options) {
  options = options || {};
  this.ros = options.ros;
  this.topicName = options.topic;
  this.tfClient = options.tfClient;
  this.rootObject = options.rootObject || new THREE.Object3D();

  // Markers that are displayed (Map ns+id--Marker)
  this.meshes = {};
  this.rosTopic = undefined;
  this.updatedTime = {};

  this.processMessageBound = this.processMessage.bind(this);
  this.subscribe();
};
ROS3D.SceneClient.prototype.__proto__ = EventEmitter3.prototype;

ROS3D.SceneClient.prototype.unsubscribe = function(){
  if(this.rosTopic){
    this.rosTopic.unsubscribe(this.processMessageBound);
  }
};

ROS3D.SceneClient.prototype.subscribe = function(){
  this.unsubscribe();

  // subscribe to the topic
  this.rosTopic = new ROSLIB.Topic({
    ros : this.ros,
    name : '/move_group/monitored_planning_scene',
    messageType : 'moveit_msgs/PlanningScene'
  });
  this.rosTopic.subscribe(this.processMessageBound);
};

ROS3D.SceneClient.prototype.processMessage = function(message){
  // remove old marker from Three.Object3D children buffer

  message.world.collision_objects.forEach (element => {
      if (element.operation === 0) {  // "ADD" or "MODIFY"

      var newMesh = new ROS3D.SceneMesh({
        message : element
      });

      this.meshes[element.id] = new ROS3D.SceneNode({
          frameID : element.header.frame_id,
          tfClient : this.tfClient,
          object : newMesh
        });
        this.rootObject.add(this.meshes[element.id]);
      }
      });

  this.emit('change');
};

ROS3D.SceneClient.prototype.removeMesh = function(key) {
  var oldNode = this.markers[key];
  if(!oldNode) {
    return;
  }
  oldNode.unsubscribeTf();
  this.rootObject.remove(oldNode);
  oldNode.children.forEach(child => {
    child.dispose();
  });
  delete(this.meshes[key]);
};
