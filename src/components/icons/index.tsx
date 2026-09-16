import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';

// SVGs from assets/icons/SVG/
import HeartSolidSvg from '../../../assets/icons/SVG/solid/heart-solid.svg';
import HeartRegularSvg from '../../../assets/icons/SVG/regular/heart.svg';
import CopySvg from '../../../assets/icons/SVG/regular/copy.svg';
import UserCheckSvg from '../../../assets/icons/SVG/solid/user-check-solid.svg';
import UserPlusSvg from '../../../assets/icons/SVG/solid/user-plus-solid.svg';
import LogoutSvg from '../../../assets/icons/SVG/regular/logout.svg';
import RefreshSvg from '../../../assets/icons/SVG/solid/refresh-solid.svg';
import PaintBrushSvg from '../../../assets/icons/SVG/solid/paint-brush-solid.svg';
import ImageSvg from '../../../assets/icons/SVG/solid/image-solid.svg';
import UsersSvg from '../../../assets/icons/SVG/solid/users-solid.svg';
import CalendarSvg from '../../../assets/icons/SVG/solid/calendar-alt-solid.svg';
import UserSvg from '../../../assets/icons/SVG/solid/user-solid.svg';
import SparklesSvg from '../../../assets/icons/SVG/solid/sparkles-solid.svg';
import PlusSvg from '../../../assets/icons/SVG/solid/plus-solid.svg';
import TimesSvg from '../../../assets/icons/SVG/solid/times-solid.svg';
import BroomSvg from '../../../assets/icons/SVG/solid/broom-solid.svg';
import ThemesSvg from '../../../assets/icons/SVG/solid/themes-solid.svg';
import PenNibSvg from '../../../assets/icons/SVG/solid/pen-nib-solid.svg';
import GridSvg from '../../../assets/icons/SVG/regular/grid.svg';
import UndoArrowSvg from '../../../assets/icons/SVG/solid/arrow-alt-circle-left-solid.svg';
import TrashSvg from '../../../assets/icons/SVG/solid/trash-solid.svg';
import ClockSvg from '../../../assets/icons/SVG/solid/clock-solid.svg';
import StarSvg from '../../../assets/icons/SVG/solid/star-solid.svg';

export interface IconProps {
  size?: number;
  color?: string;
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

const createIcon = (SvgComponent: React.FC<SvgProps>) => {
  const IconComponent: React.FC<IconProps> = ({
    size = 24,
    color = 'currentColor',
    fill,
    style,
  }) => {
    const finalColor = fill || color;
    return (
      <SvgComponent
        width={size}
        height={size}
        fill={finalColor}
        color={finalColor}
        style={style}
      />
    );
  };
  return React.memo(IconComponent);
};

// Export individual typed icon components matching Lucide names
export const Heart = createIcon(HeartSolidSvg);
export const HeartOutline = createIcon(HeartRegularSvg);
export const Copy = createIcon(CopySvg);
export const UserCheck = createIcon(UserCheckSvg);
export const UserPlus = createIcon(UserPlusSvg);
export const LogOut = createIcon(LogoutSvg);
export const RefreshCw = createIcon(RefreshSvg);
export const Paintbrush = createIcon(PaintBrushSvg);
export const Image = createIcon(ImageSvg);
export const ImageIcon = createIcon(ImageSvg);
export const Users = createIcon(UsersSvg);
export const Calendar = createIcon(CalendarSvg);
export const User = createIcon(UserSvg);
export const UserIcon = createIcon(UserSvg);
export const Sparkles = createIcon(SparklesSvg);
export const Plus = createIcon(PlusSvg);
export const X = createIcon(TimesSvg);
export const Eraser = createIcon(BroomSvg);
export const PaintBucket = createIcon(ThemesSvg);
export const Pipette = createIcon(PenNibSvg);
export const GridIcon = createIcon(GridSvg);
export const RotateCcw = createIcon(UndoArrowSvg);
export const Trash2 = createIcon(TrashSvg);
export const Clock = createIcon(ClockSvg);
export const ClockFading = createIcon(ClockSvg);
export const Star = createIcon(StarSvg);

// Generic PixelIcon component supporting all mapped icons by name
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
