import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Polygon, Rect } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

type IconRenderer = (props: { color: string }) => React.ReactNode;

const createIcon = (render: IconRenderer) => {
  const IconComponent: React.FC<IconProps> = ({
    size = 24,
    color = '#000000',
    fill,
    style,
  }) => {
    const finalColor = fill || color;
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={style}
      >
        {render({ color: finalColor })}
      </Svg>
    );
  };
  return React.memo(IconComponent);
};

export const Heart = createIcon(({ color }) => (
  <Polygon
    fill={color}
    points="23 6 23 11 22 11 22 12 21 12 21 13 20 13 20 14 19 14 19 15 18 15 18 16 17 16 17 17 16 17 16 18 15 18 15 19 14 19 14 20 13 20 13 21 11 21 11 20 10 20 10 19 9 19 9 18 8 18 8 17 7 17 7 16 6 16 6 15 5 15 5 14 4 14 4 13 3 13 3 12 2 12 2 11 1 11 1 6 2 6 2 5 3 5 3 4 4 4 4 3 10 3 10 4 11 4 11 5 13 5 13 4 14 4 14 3 20 3 20 4 21 4 21 5 22 5 22 6 23 6"
  />
));

export const HeartOutline = createIcon(({ color }) => (
  <Path
    fill={color}
    d="m22,6v-1h-1v-1h-1v-1h-6v1h-1v1h-2v-1h-1v-1h-6v1h-1v1h-1v1h-1v5h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h2v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-5h-1Zm-2,4v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-2v-1h-1v-1h-1v-1h-1v-1h-1v-1h-1v-1h-1v-1h-1v-1h-1v-3h1v-1h1v-1h4v1h1v1h1v1h2v-1h1v-1h1v-1h4v1h1v1h1v3h-1Z"
  />
));

export const Copy = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="16 20 16 22 15 22 15 23 3 23 3 22 2 22 2 6 3 6 3 5 6 5 6 20 16 20" />
    <Path fill={color} d="m16,7V1h-8v1h-1v16h1v1h13v-1h1V7h-6Zm4,10h-11V3h5v6h6v8Z" />
    <Polygon fill={color} points="22 5 22 6 17 6 17 1 18 1 18 2 19 2 19 3 20 3 20 4 21 4 21 5 22 5" />
  </>
));

export const UserCheck = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="23 9 23 10 22 10 22 11 21 11 21 12 20 12 20 13 19 13 19 14 17 14 17 13 16 13 16 12 15 12 15 11 16 11 16 10 17 10 17 11 19 11 19 10 20 10 20 9 21 9 21 8 22 8 22 9 23 9" />
    <Polygon fill={color} points="13 6 13 9 12 9 12 11 10 11 10 12 7 12 7 11 5 11 5 9 4 9 4 6 5 6 5 4 7 4 7 3 10 3 10 4 12 4 12 6 13 6" />
    <Polygon fill={color} points="16 16 16 20 15 20 15 21 2 21 2 20 1 20 1 16 2 16 2 15 3 15 3 14 4 14 4 13 6 13 6 14 11 14 11 13 13 13 13 14 14 14 14 15 15 15 15 16 16 16" />
  </>
));

export const UserPlus = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="11 20 12 20 12 21 2 21 2 20 1 20 1 17 2 17 2 16 3 16 3 15 4 15 4 14 11 14 11 15 10 15 10 18 11 18 11 20" />
    <Polygon fill={color} points="13 5 13 10 12 10 12 11 11 11 11 12 6 12 6 11 5 11 5 10 4 10 4 5 5 5 5 4 6 4 6 3 11 3 11 4 12 4 12 5 13 5" />
    <Path fill={color} d="M22,15V13H21V12H19V11H16v1H14v1H13v2H12v3h1v2h1v1h2v1h3V21h2V20h1V18h1V15Zm-4,4H17V17H15V16h2V14h1v2h2v1H18Z" />
  </>
));

export const LogOut = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="14 4 16 4 16 5 17 5 17 6 18 6 18 7 19 7 19 8 20 8 20 9 21 9 21 10 22 10 22 11 23 11 23 13 22 13 22 14 21 14 21 15 20 15 20 16 19 16 19 17 18 17 18 18 17 18 17 19 16 19 16 20 14 20 14 18 15 18 15 17 16 17 16 16 17 16 17 15 18 15 18 14 19 14 19 13 7 13 7 11 19 11 19 10 18 10 18 9 17 9 17 8 16 8 16 7 15 7 15 6 14 6 14 4" />
    <Rect fill={color} x="1" y="2" width="2" height="20" />
  </>
));

export const RefreshCw = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="23 14 23 15 22 15 22 17 21 17 21 19 20 19 20 20 19 20 19 21 17 21 17 22 15 22 15 23 9 23 9 22 7 22 7 21 5 21 5 20 3 20 3 21 2 21 2 22 1 22 1 14 9 14 9 15 8 15 8 16 7 16 7 18 8 18 8 19 10 19 10 20 14 20 14 19 16 19 16 18 17 18 17 17 18 17 18 15 19 15 19 14 23 14" />
    <Polygon fill={color} points="23 2 23 10 15 10 15 9 16 9 16 8 17 8 17 6 16 6 16 5 14 5 14 4 10 4 10 5 8 5 8 6 7 6 7 7 6 7 6 9 5 9 5 10 1 10 1 9 2 9 2 7 3 7 3 5 4 5 4 4 5 4 5 3 7 3 7 2 9 2 9 1 15 1 15 2 17 2 17 3 19 3 19 4 21 4 21 3 22 3 22 2 23 2" />
  </>
));

export const Paintbrush = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="20 2 20 12 3 12 3 2 4 2 4 1 7 1 7 4 9 4 9 1 11 1 11 6 13 6 13 1 19 1 19 2 20 2" />
    <Path fill={color} d="M3,14v2H4v1H9v4h1v1h1v1h2V22h1V21h1V17h4V16h1V14Zm8,7V19h2v2Z" />
  </>
));

export const Image = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="23 20 23 22 22 22 22 23 2 23 2 22 1 22 1 15 2 15 2 16 3 16 3 17 4 17 4 18 5 18 5 19 6 19 6 20 7 20 7 21 8 21 8 20 9 20 9 19 10 19 10 18 11 18 11 17 12 17 12 16 13 16 13 15 14 15 14 14 15 14 15 13 16 13 16 14 17 14 17 15 18 15 18 16 19 16 19 17 20 17 20 18 21 18 21 19 22 19 22 20 23 20" />
    <Path fill={color} d="m22,2v-1H2v1h-1v10h1v1h1v1h1v1h1v1h1v1h1v1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1V2h-1Zm-13,4v3h-1v1h-3v-1h-1v-3h1v-1h3v1h1Z" />
  </>
));
export const ImageIcon = Image;

export const Users = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="2 13 2 12 1 12 1 10 2 10 2 9 7 9 7 12 8 12 8 13 2 13" />
    <Polygon fill={color} points="5 7 4 7 4 5 5 5 5 4 7 4 7 5 8 5 8 6 7 6 7 8 5 8 5 7" />
    <Polygon fill={color} points="8 7 9 7 9 6 10 6 10 5 14 5 14 6 15 6 15 7 16 7 16 11 15 11 15 12 14 12 14 13 10 13 10 12 9 12 9 11 8 11 8 7" />
    <Polygon fill={color} points="19 18 20 18 20 21 19 21 19 22 5 22 5 21 4 21 4 18 5 18 5 17 6 17 6 16 8 16 8 15 16 15 16 16 18 16 18 17 19 17 19 18" />
    <Polygon fill={color} points="23 10 23 12 22 12 22 13 16 13 16 12 17 12 17 9 22 9 22 10 23 10" />
    <Polygon fill={color} points="17 6 16 6 16 5 17 5 17 4 19 4 19 5 20 5 20 7 19 7 19 8 17 8 17 6" />
  </>
));

export const Calendar = createIcon(({ color }) => (
  <>
    <Rect fill={color} x="16" y="1" width="2" height="1" />
    <Rect fill={color} x="6" y="1" width="2" height="1" />
    <Polygon fill={color} points="23 5 23 9 1 9 1 5 2 5 2 4 5 4 5 2 6 2 6 7 8 7 8 2 9 2 9 4 15 4 15 2 16 2 16 7 18 7 18 2 19 2 19 4 22 4 22 5 23 5" />
    <Polygon fill={color} points="23 11 23 22 22 22 22 23 2 23 2 22 1 22 1 11 23 11" />
  </>
));

export const User = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="7 9 6 9 6 5 7 5 7 3 8 3 8 2 10 2 10 1 14 1 14 2 16 2 16 3 17 3 17 5 18 5 18 9 17 9 17 11 16 11 16 12 14 12 14 13 10 13 10 12 8 12 8 11 7 11 7 9" />
    <Polygon fill={color} points="22 19 22 22 21 22 21 23 3 23 3 22 2 22 2 19 3 19 3 18 4 18 4 17 5 17 5 16 7 16 7 15 17 15 17 16 19 16 19 17 20 17 20 18 21 18 21 19 22 19" />
  </>
));
export const UserIcon = User;

export const Sparkles = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="23 18 23 20 21 20 21 21 20 21 20 23 18 23 18 21 17 21 17 20 15 20 15 18 17 18 17 17 18 17 18 15 20 15 20 17 21 17 21 18 23 18" />
    <Polygon fill={color} points="23 4 23 6 21 6 21 7 20 7 20 9 18 9 18 7 17 7 17 6 15 6 15 4 17 4 17 3 18 3 18 1 20 1 20 3 21 3 21 4 23 4" />
    <Polygon fill={color} points="17 11 17 13 15 13 15 14 13 14 13 15 12 15 12 16 11 16 11 18 10 18 10 20 8 20 8 18 7 18 7 16 6 16 6 15 5 15 5 14 3 14 3 13 1 13 1 11 3 11 3 10 5 10 5 9 6 9 6 8 7 8 7 6 8 6 8 4 10 4 10 6 11 6 11 8 12 8 12 9 13 9 13 10 15 10 15 11 17 11" />
  </>
));

export const Plus = createIcon(({ color }) => (
  <Polygon fill={color} points="23 11 23 13 22 13 22 14 14 14 14 22 13 22 13 23 11 23 11 22 10 22 10 14 2 14 2 13 1 13 1 11 2 11 2 10 10 10 10 2 11 2 11 1 13 1 13 2 14 2 14 10 22 10 22 11 23 11" />
));

export const X = createIcon(({ color }) => (
  <Polygon fill={color} points="15 13 16 13 16 14 17 14 17 15 18 15 18 16 19 16 19 17 20 17 20 18 21 18 21 19 22 19 22 20 21 20 21 21 20 21 20 22 19 22 19 21 18 21 18 20 17 20 17 19 16 19 16 18 15 18 15 17 14 17 14 16 13 16 13 15 11 15 11 16 10 16 10 17 9 17 9 18 8 18 8 19 7 19 7 20 6 20 6 21 5 21 5 22 4 22 4 21 3 21 3 20 2 20 2 19 3 19 3 18 4 18 4 17 5 17 5 16 6 16 6 15 7 15 7 14 8 14 8 13 9 13 9 11 8 11 8 10 7 10 7 9 6 9 6 8 5 8 5 7 4 7 4 6 3 6 3 5 2 5 2 4 3 4 3 3 4 3 4 2 5 2 5 3 6 3 6 4 7 4 7 5 8 5 8 6 9 6 9 7 10 7 10 8 11 8 11 9 13 9 13 8 14 8 14 7 15 7 15 6 16 6 16 5 17 5 17 4 18 4 18 3 19 3 19 2 20 2 20 3 21 3 21 4 22 4 22 5 21 5 21 6 20 6 20 7 19 7 19 8 18 8 18 9 17 9 17 10 16 10 16 11 15 11 15 13" />
));

export const Eraser = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="13 16 14 16 14 18 13 18 13 20 12 20 12 22 11 22 11 23 9 23 9 22 8 22 8 21 7 21 7 20 6 20 6 19 5 19 5 17 6 17 6 16 7 16 7 14 6 14 6 15 5 15 5 16 4 16 4 17 3 17 3 16 2 16 2 15 1 15 1 13 2 13 2 12 4 12 4 11 6 11 6 10 8 10 8 11 9 11 9 12 10 12 10 13 11 13 11 14 12 14 12 15 13 15 13 16" />
    <Polygon fill={color} points="23 1 23 3 22 3 22 4 21 4 21 5 20 5 20 6 19 6 19 7 18 7 18 8 17 8 17 9 16 9 16 11 17 11 17 13 16 13 16 14 14 14 14 13 13 13 13 12 12 12 12 11 11 11 11 10 10 10 10 8 11 8 11 7 13 7 13 8 15 8 15 7 16 7 16 6 17 6 17 5 18 5 18 4 19 4 19 3 20 3 20 2 21 2 21 1 23 1" />
  </>
));

export const PaintBucket = createIcon(({ color }) => (
  <Path
    fill={color}
    d="M22,16V15H21V14H17V13h1V12h1V11h1V10h1V9h1V7H21V6H20V5H19V4H18V3H17V2H15V3H14V4H13V5H12V6H11V7H10V3H9V2H8V1H3V2H2V3H1V20H2v2H3v1H21V22h1V21h1V16ZM8,7V9H3V7ZM3,12H8v2H3Zm4,7H6v1H5V19H4V18H5V17H6v1H7Zm9-7H15v1H14v1H13v1H12v1H11v1H10V10h1V9h1V8h1V7h1V6h1V5h2V6h1V7h1V9H18v1H17v1H16Z"
  />
));

export const Pipette = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="23 4 23 7 22 7 22 8 21 8 21 9 20 9 20 10 19 10 19 9 18 9 18 8 17 8 17 7 16 7 16 6 15 6 15 5 14 5 14 4 15 4 15 3 16 3 16 2 17 2 17 1 20 1 20 2 21 2 21 3 22 3 22 4 23 4" />
    <Polygon fill={color} points="18 11 19 11 19 12 18 12 18 15 17 15 17 18 16 18 16 19 14 19 14 20 11 20 11 21 8 21 8 22 5 22 5 23 3 23 3 22 4 22 4 21 5 21 5 20 6 20 6 19 7 19 7 18 8 18 8 17 9 17 9 16 12 16 12 13 11 13 11 12 8 12 8 15 7 15 7 16 6 16 6 17 5 17 5 18 4 18 4 19 3 19 3 20 2 20 2 21 1 21 1 19 2 19 2 16 3 16 3 13 4 13 4 10 5 10 5 8 6 8 6 7 9 7 9 6 12 6 12 5 13 5 13 6 14 6 14 7 15 7 15 8 16 8 16 9 17 9 17 10 18 10 18 11" />
  </>
));

export const GridIcon = createIcon(({ color }) => (
  <>
    <Path fill={color} d="m10,13H2v1h-1v8h1v1h8v-1h1v-8h-1v-1Zm-1,8H3v-6h6v6Z" />
    <Path fill={color} d="m10,2v-1H2v1h-1v8h1v1h8v-1h1V2h-1Zm-7,7V3h6v6H3Z" />
    <Path fill={color} d="m22,13h-8v1h-1v8h1v1h8v-1h1v-8h-1v-1Zm-1,8h-6v-6h6v6Z" />
    <Path fill={color} d="m22,2v-1h-8v1h-1v8h1v1h8v-1h1V2h-1Zm-1,7h-6V3h6v6Z" />
  </>
));

export const RotateCcw = createIcon(({ color }) => (
  <Path
    fill={color}
    d="m22,9v-2h-1v-2h-1v-1h-1v-1h-2v-1h-2v-1h-6v1h-2v1h-2v1h-1v1h-1v2h-1v2h-1v6h1v2h1v2h1v1h1v1h2v1h2v1h6v-1h2v-1h2v-1h1v-1h1v-2h1v-2h1v-6h-1Zm-10,4v4h-1v-1h-1v-1h-1v-1h-1v-1h-1v-2h1v-1h1v-1h1v-1h1v-1h1v4h6v2h-6Z"
  />
));

export const Trash2 = createIcon(({ color }) => (
  <>
    <Polygon fill={color} points="20 6 20 14 19 14 19 22 18 22 18 23 6 23 6 22 5 22 5 14 4 14 4 6 20 6" />
    <Polygon fill={color} points="21 3 21 5 3 5 3 3 4 3 4 2 9 2 9 1 15 1 15 2 20 2 20 3 21 3" />
  </>
));

export const Clock = createIcon(({ color }) => (
  <Path
    fill={color}
    d="m22,9v-2h-1v-2h-1v-1h-1v-1h-2v-1h-2v-1h-6v1h-2v1h-2v1h-1v1h-1v2h-1v2h-1v6h1v2h1v2h1v1h1v1h2v1h2v1h6v-1h2v-1h2v-1h1v-1h1v-2h1v-2h1v-6h-1Zm-9,7v-1h-1v-1h-1V5h2v8h1v1h1v1h1v1h-1v1h-1v-1h-1Z"
  />
));
export const ClockFading = Clock;

export const Star = createIcon(({ color }) => (
  <Polygon
    fill={color}
    points="23 8 23 10 22 10 22 11 21 11 21 12 20 12 20 13 19 13 19 14 18 14 18 19 19 19 19 23 17 23 17 22 15 22 15 21 13 21 13 20 11 20 11 21 9 21 9 22 7 22 7 23 5 23 5 19 6 19 6 14 5 14 5 13 4 13 4 12 3 12 3 11 2 11 2 10 1 10 1 8 8 8 8 6 9 6 9 4 10 4 10 2 11 2 11 1 13 1 13 2 14 2 14 4 15 4 15 6 16 6 16 8 23 8"
  />
));

export const ICONS_MAP = {
  heart: Heart,
  'heart-outline': HeartOutline,
  copy: Copy,
  'user-check': UserCheck,
  'user-plus': UserPlus,
  logout: LogOut,
  refresh: RefreshCw,
  paintbrush: Paintbrush,
  image: ImageIcon,
  users: Users,
  calendar: Calendar,
  user: UserIcon,
  sparkles: Sparkles,
  plus: Plus,
  x: X,
  star: Star,
  eraser: Eraser,
  bucket: PaintBucket,
  pipette: Pipette,
  grid: GridIcon,
  undo: RotateCcw,
  trash: Trash2,
  clock: Clock,
  'clock-fading': ClockFading,
} as const;

export type IconName = keyof typeof ICONS_MAP;

export interface PixelIconProps extends IconProps {
  name: IconName;
}

export const PixelIcon: React.FC<PixelIconProps> = ({ name, ...props }) => {
  const Component = ICONS_MAP[name];
  if (!Component) return null;
  return <Component {...props} />;
};
