import React, { useState } from "react";

const Dot = ({ onMaxClicksReached }) => {
  const [clicks, setClicks] = useState(0);
  const [greenValue, setGreenValue] = useState(0);

  const handleClick = () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);

    // Update the green value, ensuring it doesn't exceed 255
    const newGreenValue = Math.min(greenValue + 85, 255);
    setGreenValue(newGreenValue);

    if (newClicks === 3) {
      onMaxClicksReached();
    }
  };

  // Style that includes dynamic background color
  const dotStyle = {
    textAlign: "center",
    width: "2vw",
    height: "2vw",
    borderRadius: "50%",
    backgroundColor: `rgb(255, ${greenValue}, 0)`, // RGB with dynamic green component
  };

  return (
    <button className="dot" style={dotStyle} onClick={handleClick}></button>
  );
};

export default Dot;