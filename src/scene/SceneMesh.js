/**
 * @fileOverview
 */

/**
 * A SceneMesh can convert a ROS scene message into a THREE object.
 *
 * @constructor
 * @param options - object with following keys:
 *

 */
ROS3D.SceneMesh = function(options) {
  THREE.Object3D.call(this);

  options = options || {};
  var message = options.message;
  if (message.meshes[0] !== undefined) {

    var verts = []
    var indices = []

    message.meshes[0].triangles.forEach (triangle => {
      indices.push(...triangle.vertex_indices);
    });

    message.meshes[0].vertices.forEach (vertex => {
      verts.push(vertex.x, vertex.y, vertex.z);
    });

    const vertices = new Float32Array( verts );

    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    geometry.setIndex(indices);

    geometry.computeVertexNormals();

    this.material = ROS3D.makeColorMaterial( 1, 1, 1, 1 );
    this.mesh = new THREE.Mesh( geometry, this.material );

    this.add(this.mesh);
    this.updateMatrixWorld();

  }
};
ROS3D.SceneMesh.prototype.__proto__ = THREE.Object3D.prototype;

/**
 * Set the pose of this mesh to the given values.
 *
 * @param pose - the pose to set for this mesh
 */
ROS3D.SceneMesh.prototype.setPose = function(pose) {
  // set position information
  this.position.x = pose.position.x;
  this.position.y = pose.position.y;
  this.position.z = pose.position.z;

  // set the rotation
  this.quaternion.set(pose.orientation.x, pose.orientation.y,
      pose.orientation.z, pose.orientation.w);
  this.quaternion.normalize();

  // update the world
  this.updateMatrixWorld();
};

/**
 * Update this mesh.
 *
 * @param message - the mesh message
 * @return true on success otherwhise false is returned
 */
ROS3D.SceneMesh.prototype.update = function(message) {
  // set the pose and get the color
  this.setPose(message.pose);

  return true;
};

/*
 * Free memory of elements in this mesh.
 */
ROS3D.SceneMesh.prototype.dispose = function() {
  this.children.forEach(function(element) {
    if (element instanceof ROS3D.MeshResource) {
      element.children.forEach(function(scene) {
        if (scene.material !== undefined) {
          scene.material.dispose();
        }
        scene.children.forEach(function(mesh) {
          if (mesh.geometry !== undefined) {
            mesh.geometry.dispose();
          }
          if (mesh.material !== undefined) {
            mesh.material.dispose();
          }
          scene.remove(mesh);
        });
        element.remove(scene);
      });
    } else {
      if (element.geometry !== undefined) {
          element.geometry.dispose();
      }
      if (element.material !== undefined) {
          element.material.dispose();
      }
    }
    element.parent.remove(element);
  });
};
