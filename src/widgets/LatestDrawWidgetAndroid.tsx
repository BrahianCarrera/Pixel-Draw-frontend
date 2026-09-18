import React from 'react';
import {
  FlexWidget,
  ImageWidget,
  TextWidget,
} from 'react-native-android-widget';

export interface LatestDrawAndroidWidgetProps {
  hasDrawing: boolean;
  title: string;
  authorName: string;
  createdAt: string;
  /** PNG as data URI: "data:image/png;base64,..." */
  imageDataUri?: string;
  isMyDrawing?: boolean;
}

export function LatestDrawWidgetAndroid({
  hasDrawing,
  title,
  authorName,
  createdAt,
  imageDataUri,
  isMyDrawing,
}: LatestDrawAndroidWidgetProps) {
  const accentColor = '#e11d48';

  const displayTitle =
    title?.trim() || (hasDrawing ? 'Nuevo dibujo' : 'PixelDraw');

  const authorDisplay = hasDrawing
    ? isMyDrawing
      ? 'De ti para tu amor'
      : authorName
        ? `De ${authorName}`
        : 'De tu pareja'
    : 'Sin dibujos aún';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
      }}
      clickAction="OPEN_APP"
    >
      {/* Header row */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 6,
        }}
      >
        <TextWidget
          text="♥ PixelDraw"
          style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: accentColor,
          }}
        />
      </FlexWidget>

      {/* Image or placeholder */}
      {hasDrawing && imageDataUri ? (
        <ImageWidget
          image={imageDataUri as `data:image${string}`}
          imageWidth={128}
          imageHeight={128}
          radius={10}
        />
      ) : (
        <FlexWidget
          style={{
            width: 96,
            height: 96,
            borderRadius: 10,
            backgroundColor: '#f5f5f5',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text="🎨"
            style={{ fontSize: 36 }}
          />
        </FlexWidget>
      )}

      {/* Title */}
      <TextWidget
        text={displayTitle}
        style={{
          fontSize: 13,
          fontWeight: 'bold',
          color: '#111111',
          paddingTop: 6,
          paddingBottom: 2,
        }}
        truncate="END"
        maxLines={1}
      />

      {/* Author */}
      <TextWidget
        text={authorDisplay}
        style={{
          fontSize: 11,
          color: '#666666',
        }}
        truncate="END"
        maxLines={1}
      />

      {/* Date */}
      {!!createdAt && (
        <TextWidget
          text={createdAt}
          style={{
            fontSize: 10,
            color: '#999999',
            paddingTop: 2,
          }}
        />
      )}
    </FlexWidget>
  );
}
