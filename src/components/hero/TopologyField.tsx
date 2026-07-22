import { useFrame } from '@react-three/fiber';
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { MathUtils, Object3D, type Group, type InstancedMesh } from 'three';

interface TopologyFieldProps {
  count: number;
}

function seededUnit(index: number, salt: number): number {
  const value = Math.sin((index + 1) * (12.9898 + salt * 78.233)) * 43758.5453;
  return value - Math.floor(value);
}

export function TopologyField({ count }: TopologyFieldProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<InstancedMesh>(null);
  const transforms = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = seededUnit(index, 1) * Math.PI * 2;
        const radius = MathUtils.lerp(2.2, 5.1, seededUnit(index, 2));

        return {
          position: [
            Math.cos(angle) * radius,
            MathUtils.lerp(-2.8, 2.8, seededUnit(index, 3)),
            Math.sin(angle) * radius - 1.6,
          ] as const,
          scale: MathUtils.lerp(0.45, 1.2, seededUnit(index, 4)),
        };
      }),
    [count],
  );

  useLayoutEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const transform = new Object3D();
    transforms.forEach(({ position, scale }, index) => {
      transform.position.set(...position);
      transform.scale.setScalar(scale);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.018;
    }
  });

  if (count === 0) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <octahedronGeometry args={[0.035, 0]} />
        <meshBasicMaterial color="#6ee7ff" transparent opacity={0.62} />
      </instancedMesh>
    </group>
  );
}
