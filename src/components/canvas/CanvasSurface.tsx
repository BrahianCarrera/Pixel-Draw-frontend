import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import { CanvasSurfaceProps, CanvasSurfaceRef } from './CanvasSurface.types';
import { CanvasSurface as WebSurface } from './CanvasSurface.web';
import { CanvasSurface as NativeSurface } from './CanvasSurface.native';

export * from './CanvasSurface.types';

export const CanvasSurface = forwardRef<CanvasSurfaceRef, CanvasSurfaceProps>((props, ref) => {
  if (Platform.OS === 'web') {
    return <WebSurface ref={ref} {...props} />;
  }
  return <NativeSurface ref={ref} {...props} />;
});
