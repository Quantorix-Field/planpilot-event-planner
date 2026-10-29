import { useState } from "react";
import { applyMotion, readMotion, saveMotion } from "../motion";

/** Lets visitors pause all animation (WCAG 2.2.2). The choice is remembered on this device. */
export function MotionToggle() {
  const [paused, setPaused] = useState(() => readMotion() === "off");

  function toggle() {
    const next = paused ? "on" : "off";
    applyMotion(next);
    saveMotion(next);
    setPaused(!paused);
  }

  return (
    <button type="button" className="btn btn-light btn-small" onClick={toggle}>
      {paused ? "Resume animations" : "Pause animations"}
    </button>
  );
}
