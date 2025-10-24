import React from "react";
import { View, ViewProps } from "react-native";
import { useSafeAreaInsets, Edge } from "react-native-safe-area-context";

interface SafeAreaViewProps extends ViewProps {
  edges?: Edge[];
  children: React.ReactNode;
}

/**
 * Componente wrapper para SafeAreaView com suporte a edge-to-edge
 *
 * @param edges - Array de edges para aplicar padding (top, bottom, left, right)
 * @example
 * <SafeAreaView edges={['top', 'bottom']}>
 *   <View>Conteúdo</View>
 * </SafeAreaView>
 */
export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  edges = ["top", "bottom", "left", "right"],
  style,
  children,
  ...props
}) => {
  const insets = useSafeAreaInsets();

  const paddingStyle = {
    paddingTop: edges.includes("top") ? insets.top : 0,
    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
    paddingLeft: edges.includes("left") ? insets.left : 0,
    paddingRight: edges.includes("right") ? insets.right : 0,
  };

  return (
    <View style={[paddingStyle, style]} {...props}>
      {children}
    </View>
  );
};
