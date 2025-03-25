/**
 * @fileOverview
 */

/**
 * A scene client that listens to a given scene topic.
 *
 * Emits the following events:
 *
 *  * 'change' - there was an update or change in the mesh
 *
 * @constructor
 * @param options - object with following keys:
 *
 *   * ros - the ROSLIB.Ros connection handle
 *   * topic - the scene topic to listen to
 *   * tfClient - the TF client handle to use
 *   * rootObject (optional) - the root object to add this mesh to
 */
ROS3D.SceneClient = function(options) {
  options = options || {};
  this.ros = options.ros;
  this.topicName = options.topic;
  this.tfClient = options.tfClient;
  this.rootObject = options.rootObject || new THREE.Object3D();

  // meshes that are displayed (Map ns+id--mesh)
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

  message.robot_state.attached_collision_objects.forEach (element => {
    if (element.object.operation === 0) {  // "ADD" or "MODIFY"
      if (!(element.object.id in this.meshes)) {
        var newMesh = new ROS3D.SceneMesh({
          message : element.object
        });

        this.meshes[element.object.id] = new ROS3D.SceneNode({
          frameID : element.object.header.frame_id,
          tfClient : this.tfClient,
          object : newMesh
        });
        this.rootObject.add(this.meshes[element.object.id]);
      }
      this.meshes[element.object.id].children[0].material.color.setRGB(0.3, 0, 0.3);
      this.meshes[element.object.id].children[0].material.transparent = true;
      this.meshes[element.object.id].children[0].material.opacity = 0.7;
      this.meshes[element.object.id].updatePose(element.object.pose);
    } else {
      this.removeMesh(element.object.id);
    }
  });

  message.world.collision_objects.forEach (element => {
    if (element.operation === 0) {  // "ADD" or "MODIFY"

      var newMesh = new ROS3D.SceneMesh({
        message : element
      });
      if(!(element.id in this.meshes)) {
        this.meshes[element.id] = new ROS3D.SceneNode({
          frameID : element.header.frame_id,
          tfClient : this.tfClient,
          object : newMesh
        });
        this.rootObject.add(this.meshes[element.id]);
      }
      this.meshes[element.id].children[0].setPose(element.pose);
      if(element.pose.position.x !== 0 && element.pose.position.y !== 0 && element.pose.position.z !== 0) {
      }
    } else {
      this.removeMesh(element.id);
    }
  });
  message.object_colors.forEach( color => {
    this.meshes[color.id].children[0].material.color.setRGB(color.color.r, color.color.g, color.color.b);
    if (color.color.a < 1) {
      this.meshes[color.id].children[0].material.transparent = true;
      this.meshes[color.id].children[0].material.opacity = color.color.a;
    }
  });
  this.emit('change');
};

ROS3D.SceneClient.prototype.removeMesh = function(key) {
  var oldNode = this.meshes[key];
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
