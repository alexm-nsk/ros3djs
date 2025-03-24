message.meshes[0].triangles.forEach (triangle => {
  triangle.vertex_indices.forEach(v_i => {
    const vertex = message.meshes[0].vertices[v_i]
    verts.push(vertex.x);
    verts.push(vertex.y);
    verts.push(vertex.z);
    const normLength = Math.sqrt(Math.pow(vertex.x, 2) +
    Math.pow(vertex.y, 2) +
    Math.pow(vertex.z, 2));
    norms.push(vertex.x / normLength);
    norms.push(vertex.y / normLength);
    norms.push(vertex.z / normLength);
  });
});