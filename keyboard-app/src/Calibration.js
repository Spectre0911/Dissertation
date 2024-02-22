import React, { useState, useEffect } from "react";
import Dot from "./Dot";
import { sendCalibrationData } from "./services/sendCalibrationData";

const Calibration = ({
  prediction,
  keyboardTestMode,
  setCalibrationComplete,
}) => {
  const totalDots = 20;
  // const buttonWidth = calc(100vw / 3 - 8px)

  const [dotsClicked, setDotsClicked] = useState(0);
  const order = [
    0, 1, 2, 3, 7, 11, 15, 19, 18, 17, 16, 12, 8, 4, 5, 6, 10, 14, 13, 9,
  ];
  const [currentDotIndex, setCurrentDotIndex] = useState(0);
  const [currentDot, setCurrentDot] = useState(0);
  const [firstEllapsed, setFirstEllapsed] = useState(0);
  const [predictions, setPredictions] = useState([]);
  const [accuracy, setAccuracy] = useState(0);
  const [currentCenter, setCurrentCenter] = useState({ x: 0, y: 0 });
  const [currentRound, setCurrentRound] = useState(0);
  const [roundAverages, setroundAverages] = useState([[], [], [], []]);
  const [buttonWidth, setButtonWidth] = useState(0);

  const logCalibration = async () => {
    let mode = "3by5";
    const data = roundAverages.map((average, index) => {
      const roundAverage = calculateError(average);
      let calibrationQuality = "";
      if (roundAverage < buttonWidth / 8) {
        calibrationQuality = "Excellent calibration";
      } else if (roundAverage < buttonWidth / 4) {
        calibrationQuality = "Good calibration";
      } else if (roundAverage < buttonWidth / 2) {
        calibrationQuality = "Fair calibration";
      } else {
        calibrationQuality = "Poor calibration";
      }

      return {
        round: index,
        average: roundAverage,
        calibration: calibrationQuality,
        mode: mode,
      };
    });

    await sendCalibrationData(data);
  };

  const handleMaxClicks = () => {
    setDotsClicked((prev) => {
      return prev + 1;
    });
  };

  const predictionError = (newPrediction) => {
    const x = newPrediction.x;
    const y = newPrediction.y;
    const { x: centerX, y: centerY } = currentCenter;
    const error = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    return error;
  };

  const calculateError = (points) => {
    return (
      points.reduce((acc, curr) => {
        if (!curr) {
          return acc;
        }

        return acc + curr;
      }, 0) / points.length
    );
  };

  useEffect(() => {
    const calculateWidth = () => {
      const vw = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      );
      const width = vw / 3 - 8; // Subtract 8 pixels as per your formula
      setButtonWidth(width);
    };

    // Calculate width on mount`
    calculateWidth();

    // Recalculate width if the window is resized
    window.addEventListener("resize", calculateWidth);

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", calculateWidth);
  }, []); // Empty dependency array means this effect runs only once on mount

  useEffect(() => {
    setCurrentDot(order[currentDotIndex]);
    if (currentDotIndex === totalDots - 1) {
      setCurrentRound((prev) => {
        return prev + 1;
      });
    }
  }, [currentDotIndex]);

  useEffect(() => {}, [roundAverages]);

  useEffect(() => {
    // When the current dot changes, set a lower bound, time threshold for the dots
    if (prediction.ts) {
      setFirstEllapsed(prediction.ts);
    }

    let currentError = calculateError(predictions);
    let subArray = roundAverages[currentRound];
    subArray.push(currentError);
    setroundAverages((prev) => {
      let newPrev = [...prev];
      newPrev[currentRound] = subArray;
      return newPrev;
    });

    // Also clear the current Predictions
    setPredictions((prevPredictions) => {
      setAccuracy(currentError);
      return [];
    });
  }, [currentDot]);

  useEffect(() => {
    if (prediction && prediction.ts >= firstEllapsed) {
      const predError = predictionError(prediction);
      setPredictions([...predictions, predError]);
    }
  }, [prediction]);

  useEffect(() => {
    if (dotsClicked === totalDots || keyboardTestMode) {
      setCalibrationComplete(true);
      return;
    }
    logCalibration();
  }, [dotsClicked]);

  return (
    <div
      className="dot-grid-container"
      style={{
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          zIndex: 2,
          textAlign: "center",
          left: "calc(50vw - 1em)",
          top: "50vh",
          fontSize: "2em",
        }}
      >
        {accuracy.toFixed(2)}
      </div>

      {[...Array(totalDots)].map((_, i) => (
        <Dot
          onMaxClicksReached={handleMaxClicks}
          index={i}
          currentDot={currentDot}
          setCurrentDotIndex={setCurrentDotIndex}
          prediction={prediction}
          setCurrentCenter={setCurrentCenter}
          totalDots={totalDots}
        />
      ))}
    </div>
  );
};

export default Calibration;
