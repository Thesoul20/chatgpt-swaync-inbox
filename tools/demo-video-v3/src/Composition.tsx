import { Video } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const FPS = 30;
const W = 1920;
const H = 1080;

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const clamp = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

const StoryLabel: React.FC<{
  step: string;
  title: string;
  subtitle: string;
  from?: number;
  to?: number;
}> = ({ step, title, subtitle, from = 0, to = 120 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, from + 10, to - 12, to], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 62,
        bottom: 54,
        opacity,
        color: "#ecfff7",
        fontFamily:
          'Inter, "Noto Sans", "Noto Sans CJK SC", system-ui, -apple-system, sans-serif',
        textShadow: "0 2px 18px rgba(0,0,0,0.7)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 13px",
          borderRadius: 999,
          background: "rgba(7, 23, 18, 0.78)",
          border: "1px solid rgba(111, 255, 199, 0.42)",
          color: "#86ffd0",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: 1.3,
        }}
      >
        {step}
      </div>
      <div style={{ marginTop: 14, fontSize: 42, fontWeight: 720, lineHeight: 1.04 }}>
        {title}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 24,
          fontWeight: 500,
          color: "rgba(236,255,247,0.82)",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

const ProductMark: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 32,
      left: 40,
      padding: "8px 13px",
      borderRadius: 999,
      color: "rgba(231,255,246,0.78)",
      background: "rgba(5,16,13,0.58)",
      border: "1px solid rgba(164,255,220,0.18)",
      fontFamily: 'Inter, "Noto Sans", system-ui, sans-serif',
      fontSize: 17,
      fontWeight: 650,
      letterSpacing: 0.5,
    }}
  >
    ChatGPT swaync Inbox
  </div>
);

const AskScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#020503" }}>
      <Video
        src={staticFile("sources/ask.mp4")}
        volume={0}
        objectFit="cover"
        style={{
          width: "100%",
          height: "100%",
          scale: clamp(frame, [0, 75], [1.015, 1.18]),
          translate: `0px ${clamp(frame, [0, 75], [0, 12])}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.12), transparent 42%, transparent 75%, rgba(0,0,0,0.12))",
        }}
      />
      <StoryLabel
        step="01  ASK"
        title="Send the task."
        subtitle="Then keep your attention where it belongs."
        to={90}
      />
      <ProductMark />
    </AbsoluteFill>
  );
};

const WorkScene: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = clamp(frame, [115, 165], [1.01, 1.31]);
  const y = clamp(frame, [115, 165], [0, 92]);
  const focusOpacity = clamp(frame, [125, 158], [0, 1]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#020503" }}>
      <Video
        src={staticFile("sources/work.mp4")}
        volume={0}
        objectFit="cover"
        style={{
          width: "100%",
          height: "100%",
          scale: zoom,
          translate: `0px ${y}px`,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: focusOpacity * 0.18,
          background: "rgba(0,0,0,0.55)",
          maskImage:
            "radial-gradient(ellipse 280px 130px at 50% 5%, transparent 0%, transparent 72%, black 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 1188,
          width: 390,
          height: 92,
          borderRadius: 18,
          opacity: focusOpacity,
          border: "2px solid rgba(113,255,201,0.7)",
          boxShadow: "0 0 36px rgba(79,255,186,0.18)",
        }}
      />
      <StoryLabel
        step="02  KEEP WORKING"
        title="ChatGPT finishes in the background."
        subtitle="Your current app stays focused."
        to={255}
      />
      <ProductMark />
    </AbsoluteFill>
  );
};

const InboxScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#020503" }}>
      <Video
        src={staticFile("sources/inbox.mp4")}
        volume={0}
        objectFit="cover"
        style={{
          width: "100%",
          height: "100%",
          scale: clamp(frame, [28, 105], [1.01, 1.42]),
          translate: `0px ${clamp(frame, [28, 105], [0, 26])}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 225,
          left: 1135,
          width: 560,
          height: 104,
          borderRadius: 16,
          opacity: clamp(frame, [55, 82], [0, 1]),
          border: "2px solid rgba(113,255,201,0.78)",
          boxShadow: "0 0 42px rgba(74,255,186,0.2)",
        }}
      />
      <StoryLabel
        step="03  RESULT WAITS"
        title="The answer becomes an inbox item."
        subtitle="Persistent until you choose to return."
        to={135}
      />
      <ProductMark />
    </AbsoluteFill>
  );
};

const ClickRipple: React.FC = () => {
  const frame = useCurrentFrame();
  const ripple = interpolate(frame, [76, 92], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 968,
        top: 186,
        width: 56 + ripple * 54,
        height: 56 + ripple * 54,
        borderRadius: "50%",
        border: "3px solid rgba(111,255,200,0.9)",
        opacity: ripple > 0 ? 1 - ripple : 0,
        transform: "translate(-50%, -50%)",
        boxShadow: "0 0 30px rgba(82,255,190,0.34)",
      }}
    />
  );
};

const ReturnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const landing = clamp(frame, [102, 138], [0, 1]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#020503" }}>
      <Video
        src={staticFile("sources/return.mp4")}
        volume={0}
        objectFit="cover"
        style={{
          width: "100%",
          height: "100%",
          scale: interpolate(frame, [0, 82, 116, 145, 224], [1.42, 1.48, 1.02, 1, 1.035], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
          translate: `0px ${interpolate(frame, [0, 82, 116], [22, 34, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          })}px`,
        }}
      />
      <ClickRipple />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: landing * 0.22,
          boxShadow: "inset 0 0 180px rgba(67,255,181,0.14)",
          pointerEvents: "none",
        }}
      />
      <StoryLabel
        step="04  CLICK TO RETURN"
        title="One click restores the originating chat."
        subtitle="The completed answer is waiting in context."
        to={225}
      />
      <ProductMark />
    </AbsoluteFill>
  );
};

export const MainDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#020503" }}>
    <Sequence durationInFrames={90}>
      <AskScene />
    </Sequence>
    <Sequence from={90} durationInFrames={255}>
      <WorkScene />
    </Sequence>
    <Sequence from={345} durationInFrames={135}>
      <InboxScene />
    </Sequence>
    <Sequence from={480} durationInFrames={225}>
      <ReturnScene />
    </Sequence>
  </AbsoluteFill>
);

export const Preview: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#020503" }}>
    <Sequence durationInFrames={90}>
      <InboxScene />
    </Sequence>
    <Sequence from={90} durationInFrames={150} trimBefore={45}>
      <ReturnScene />
    </Sequence>
  </AbsoluteFill>
);

export const DemoCompositions: React.FC = () => (
  <>
    <Composition id="MainDemo" component={MainDemo} durationInFrames={705} fps={FPS} width={W} height={H} />
    <Composition id="Preview" component={Preview} durationInFrames={240} fps={FPS} width={W} height={H} />
  </>
);
