/**
 * Safe area wrapper for notched devices (Dynamic Island, home indicator).
 * Use edges="full" on auth / full-screen; default omits top when a stack header is shown.
 */

import React from 'react';
import {SafeAreaView, type Edge} from 'react-native-safe-area-context';

export type ScreenSafeAreaProps = {
  children: React.ReactNode;
  /**
   * `content` — left/right/bottom only; use when a native stack header already clears the status bar.
   * `full` — all edges; use for tab-root screens with `headerShown: false` and an in-screen title
   * (e.g. Cash register, Reports) so content does not sit under the status bar / Dynamic Island.
   */
  variant?: 'full' | 'content';
};

const edgesFull: Edge[] = ['top', 'left', 'right', 'bottom'];
const edgesContent: Edge[] = ['left', 'right', 'bottom'];

export const ScreenSafeArea: React.FC<ScreenSafeAreaProps> = ({
  children,
  variant = 'content',
}) => (
  <SafeAreaView
    style={{flex: 1}}
    edges={variant === 'full' ? edgesFull : edgesContent}>
    {children}
  </SafeAreaView>
);
