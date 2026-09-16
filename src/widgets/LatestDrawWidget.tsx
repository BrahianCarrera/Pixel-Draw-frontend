'widget';

import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import {
  VStack,
  HStack,
  ZStack,
  Text,
  Image,
  Spacer,
} from '@expo/ui/swift-ui';
import {
  font,
  padding,
  cornerRadius,
  widgetURL,
  frame,
  aspectRatio,
  resizable,
  containerBackground,
  bold,
} from '@expo/ui/swift-ui/modifiers';

export interface LatestDrawWidgetProps {
  hasDrawing: boolean;
  title: string;
  authorName: string;
  createdAt: string;
  imageUri?: string;
  isMyDrawing?: boolean;
}

export function LatestDrawWidget(
  props: LatestDrawWidgetProps,
  context: WidgetEnvironment
) {
  'widget';

  const family = context?.widgetFamily || 'systemSmall';
  const isDark = context?.colorScheme === 'dark';

  const bg = isDark ? '#18181b' : '#ffffff';
  const accentColor = '#e11d48';

  const displayTitle = props?.title?.trim() || (props?.hasDrawing ? 'Nuevo dibujo' : 'PixelDraw');
  const authorDisplay = props?.hasDrawing
    ? props?.isMyDrawing
      ? 'De ti para tu amor'
      : props?.authorName
        ? `De ${props.authorName}`
        : 'De tu pareja'
    : 'Sin dibujos aún';

  // 1. Medium Widget (Horizontal side-by-side)
  if (family === 'systemMedium') {
    return (
      <HStack
        alignment="center"
        spacing={12}
        modifiers={[
          containerBackground(bg, 'widget'),
          widgetURL('pixeldraw://'),
          padding({ all: 12 }),
        ]}
      >
        {/* Drawing Thumbnail or Placeholder */}
        <ZStack
          modifiers={[
            frame({ width: 116, height: 116 }),
            cornerRadius(12),
          ]}
        >
          {props?.hasDrawing && props?.imageUri ? (
            <Image
              uiImage={props.imageUri}
              modifiers={[
                resizable(),
                aspectRatio({ ratio: 1, contentMode: 'fit' }),
                cornerRadius(10),
              ]}
            />
          ) : (
            <VStack
              alignment="center"
              spacing={4}
              modifiers={[
                padding({ all: 8 }),
              ]}
            >
              <Image
                systemName="paintbrush.fill"
                size={34}
                color={accentColor}
              />
              <Text
                modifiers={[
                  font({ size: 10, weight: 'medium' }),
                  padding({ top: 4 }),
                ]}
              >
                Sin dibujo
              </Text>
            </VStack>
          )}
        </ZStack>

        {/* Content column */}
        <VStack
          alignment="leading"
          spacing={4}
        >
          <HStack alignment="center" spacing={4}>
            <Image
              systemName="heart.fill"
              size={12}
              color={accentColor}
            />
            <Text
              modifiers={[
                font({ size: 11, weight: 'semibold' }),
              ]}
            >
              PixelDraw
            </Text>
          </HStack>

          <Text
            modifiers={[
              font({ size: 15, weight: 'bold' }),
              bold(),
            ]}
          >
            {displayTitle}
          </Text>

          <Text
            modifiers={[
              font({ size: 12, weight: 'medium' }),
            ]}
          >
            {authorDisplay}
          </Text>

          {props?.createdAt ? (
            <Text
              modifiers={[
                font({ size: 10 }),
              ]}
            >
              {props.createdAt}
            </Text>
          ) : null}

          <Spacer />

          <Text
            modifiers={[
              font({ size: 11, weight: 'semibold' }),
            ]}
          >
            Toca para abrir ✨
          </Text>
        </VStack>
      </HStack>
    );
  }

  // 2. Large Widget (Vertical full card)
  if (family === 'systemLarge') {
    return (
      <VStack
        alignment="center"
        spacing={10}
        modifiers={[
          containerBackground(bg, 'widget'),
          widgetURL('pixeldraw://'),
          padding({ all: 16 }),
        ]}
      >
        <HStack alignment="center">
          <Image
            systemName="heart.fill"
            size={14}
            color={accentColor}
          />
          <Text
            modifiers={[
              font({ size: 13, weight: 'bold' }),
              bold(),
              padding({ leading: 4 }),
            ]}
          >
            PixelDraw Amor
          </Text>
          <Spacer />
          {props?.createdAt ? (
            <Text
              modifiers={[
                font({ size: 11 }),
              ]}
            >
              {props.createdAt}
            </Text>
          ) : null}
        </HStack>

        {/* Large Drawing Preview */}
        <ZStack
          modifiers={[
            frame({ width: 220, height: 220 }),
            cornerRadius(16),
          ]}
        >
          {props?.hasDrawing && props?.imageUri ? (
            <Image
              uiImage={props.imageUri}
              modifiers={[
                resizable(),
                aspectRatio({ ratio: 1, contentMode: 'fit' }),
                cornerRadius(14),
              ]}
            />
          ) : (
            <VStack
              alignment="center"
              spacing={8}
            >
              <Image
                systemName="paintbrush.fill"
                size={48}
                color={accentColor}
              />
              <Text
                modifiers={[
                  font({ size: 13, weight: 'medium' }),
                ]}
              >
                Aún no hay dibujos compartidos
              </Text>
            </VStack>
          )}
        </ZStack>

        <VStack alignment="center" spacing={3}>
          <Text
            modifiers={[
              font({ size: 17, weight: 'bold' }),
              bold(),
            ]}
          >
            {displayTitle}
          </Text>
          <Text
            modifiers={[
              font({ size: 13, weight: 'medium' }),
            ]}
          >
            {authorDisplay}
          </Text>
        </VStack>

        <Spacer />

        <Text
          modifiers={[
            font({ size: 11, weight: 'medium' }),
          ]}
        >
          Toca para responder con un nuevo dibujo ❤️
        </Text>
      </VStack>
    );
  }

  // 3. Small Widget (Default, square compact)
  return (
    <VStack
      alignment="center"
      spacing={6}
      modifiers={[
        containerBackground(bg, 'widget'),
        widgetURL('pixeldraw://'),
        padding({ all: 10 }),
      ]}
    >
      <HStack alignment="center">
        <Image
          systemName="heart.fill"
          size={11}
          color={accentColor}
        />
        <Text
          modifiers={[
            font({ size: 11, weight: 'bold' }),
            bold(),
            padding({ leading: 3 }),
          ]}
        >
          PixelDraw
        </Text>
        <Spacer />
      </HStack>

      <ZStack
        modifiers={[
          frame({ width: 88, height: 88 }),
          cornerRadius(10),
        ]}
      >
        {props?.hasDrawing && props?.imageUri ? (
          <Image
            uiImage={props.imageUri}
            modifiers={[
              resizable(),
              aspectRatio({ ratio: 1, contentMode: 'fit' }),
              cornerRadius(8),
            ]}
          />
        ) : (
          <VStack alignment="center" spacing={2}>
            <Image
              systemName="paintbrush.fill"
              size={28}
              color={accentColor}
            />
            <Text
              modifiers={[
                font({ size: 9, weight: 'medium' }),
              ]}
            >
              Sin dibujo
            </Text>
          </VStack>
        )}
      </ZStack>

      <Text
        modifiers={[
          font({ size: 11, weight: 'semibold' }),
        ]}
      >
        {displayTitle}
      </Text>
    </VStack>
  );
}

export default createWidget('LatestDrawWidget', LatestDrawWidget);
