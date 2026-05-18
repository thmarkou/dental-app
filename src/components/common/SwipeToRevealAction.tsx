/**
 * Swipe row left to reveal a trailing action (PanResponder — no native module).
 */

import React, {useRef} from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

const ACTION_WIDTH = 96;
const OPEN_THRESHOLD = ACTION_WIDTH * 0.3;

export interface SwipeToRevealActionProps {
  children: React.ReactNode;
  onActionPress: () => void;
  actionLabel: string;
  enabled?: boolean;
  containerStyle?: ViewStyle;
}

const SwipeToRevealAction: React.FC<SwipeToRevealActionProps> = ({
  children,
  onActionPress,
  actionLabel,
  enabled = true,
  containerStyle,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const currentX = useRef(0);

  const snapTo = (open: boolean) => {
    isOpen.current = open;
    const toValue = open ? -ACTION_WIDTH : 0;
    currentX.current = toValue;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        enabled &&
        Math.abs(gesture.dx) > 6 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.3,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        enabled &&
        Math.abs(gesture.dx) > 12 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          currentX.current = typeof value === 'number' ? value : 0;
          isOpen.current = currentX.current <= -OPEN_THRESHOLD;
        });
      },
      onPanResponderMove: (_, gesture) => {
        if (!enabled) {
          return;
        }
        const start = isOpen.current ? -ACTION_WIDTH : 0;
        const next = Math.min(0, Math.max(-ACTION_WIDTH, start + gesture.dx));
        currentX.current = next;
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        if (!enabled) {
          return;
        }
        const projected = currentX.current + gesture.vx * 40;
        const shouldOpen =
          projected < -OPEN_THRESHOLD ||
          gesture.vx < -0.25 ||
          currentX.current < -OPEN_THRESHOLD;
        snapTo(shouldOpen);
      },
      onPanResponderTerminate: () => {
        snapTo(isOpen.current);
      },
    }),
  ).current;

  if (!enabled) {
    return <View style={containerStyle}>{children}</View>;
  }

  return (
    <View className="overflow-hidden rounded-xl" style={containerStyle}>
      <View
        className="absolute bottom-0 right-0 top-0 items-center justify-center bg-red-600"
        style={{width: ACTION_WIDTH}}>
        <Pressable
          onPress={onActionPress}
          className="h-full w-full items-center justify-center active:bg-red-700"
          accessibilityRole="button"
          accessibilityLabel={actionLabel}>
          <Text className="text-center text-sm font-semibold text-white">
            {actionLabel}
          </Text>
        </Pressable>
      </View>
      <Animated.View
        style={{transform: [{translateX}]}}
        {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
};

export default SwipeToRevealAction;
