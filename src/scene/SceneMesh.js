/**
 * @fileOverview
 * @author David Gossow - dgossow@willowgarage.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A SceneMesh can convert a ROS marker message into a THREE object.
 *
 * @constructor
 * @param options - object with following keys:
 *

 */
ROS3D.SceneMesh = function(options) {
  THREE.Object3D.call(this);

  options = options || {};
  var message = options.message;

  if (message.id.includes('brick') && message.meshes[0] != undefined) {
    if(message.id in objects) {
      viewer.scene.remove(objects[message.id])
    }
      const geometry = new THREE.BufferGeometry();

      verts = []
      norms = []
      for (triangle of message.meshes[0].triangles) {
      for(v_i of triangle.vertex_indices) {
        verts.push(message.meshes[0].vertices[v_i].x);
        verts.push(message.meshes[0].vertices[v_i].y);
        verts.push(message.meshes[0].vertices[v_i].z);
        normLength = Math.sqrt(message.meshes[0].vertices[v_i].x ** 2 + message.meshes[0].vertices[v_i].y ** 2 + message.meshes[0].vertices[v_i].z ** 2);
        norms.push(message.meshes[0].vertices[v_i].x/normLength);
        norms.push(message.meshes[0].vertices[v_i].y/normLength);
        norms.push(message.meshes[0].vertices[v_i].z/normLength);
      }
    }
    const vertices = new Float32Array( verts );
    const normals = new Float32Array( norms );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    geometry.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    const material = new ROS3D.makeColorMaterial( 1, 1, 1, 1 );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.position.x = message.pose.position.x;
    mesh.position.y = message.pose.position.y;
    mesh.position.z = message.pose.position.z;
    mesh.rotation.setFromQuaternion(new THREE.Quaternion(
      message.pose.orientation.x,
      message.pose.orientation.y,
      message.pose.orientation.z,
      message.pose.orientation.w
    ));

    viewer.addObject(mesh, false);

    objects[message.id] = mesh;
  }
};
ROS3D.SceneMesh.prototype.__proto__ = THREE.Object3D.prototype;

/**
 * Set the pose of this marker to the given values.
 *
 * @param pose - the pose to set for this marker
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
 * Update this marker.
 *
 * @param message - the marker message
 * @return true on success otherwhise false is returned
 */
ROS3D.SceneMesh.prototype.update = function(message) {
  // set the pose and get the color
  this.setPose(message.pose);

  return true;
};

/*
 * Free memory of elements in this marker.
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
