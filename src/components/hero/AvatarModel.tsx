import { useGLTF } from '@react-three/drei';
import React, { useEffect, useMemo } from 'react';
import { Mesh, type Object3D } from 'three';

interface AvatarModelProps {
  path: string;
  visible: boolean;
  shadows: boolean;
  onLoaded: () => void;
}

function prepareModel(source: Object3D, shadows: boolean): Object3D {
  const model = source.clone(true);

  model.traverse((object) => {
    if (object instanceof Mesh) {
      object.castShadow = shadows;
      object.receiveShadow = false;
    }
  });

  return model;
}

export function AvatarModel({
  path,
  visible,
  shadows,
  onLoaded,
}: AvatarModelProps) {
  const { scene } = useGLTF(path, false, true);
  const model = useMemo(() => prepareModel(scene, shadows), [scene, shadows]);

  useEffect(() => {
    onLoaded();
  }, [onLoaded, path]);

  return (
    <primitive
      object={model}
      position={[0, -1.85, 0]}
      rotation={[0, -0.2, 0]}
      scale={2.15}
      visible={visible}
      dispose={null}
    />
  );
}
