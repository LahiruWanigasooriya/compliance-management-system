"use client";

import { Hatch, Grid } from "ldrs/react";
import "ldrs/react/Hatch.css";
import "ldrs/react/Grid.css";

const Loader = ({
  size = "35",
  speed = "2.75",
  lightColor = "#3d5a5c",
  darkColor = "#000000",
  className = "w-8 h-8",
  themeInverted = false,
  variant = "ripples",
  stroke = "4",
}) => {
  // const getColor = () => {
  //   if (themeInverted) {
  //     return actualTheme !== 'dark' ? darkColor : lightColor;
  //   } else {
  //     return actualTheme === 'dark' ? darkColor : lightColor;
  //   }
  // };
  const getColor = () => {
    return lightColor;
  };

  const renderLoader = () => {
    const color = getColor();

    if (variant === "grid") {
      const { stroke: _, ...gridProps } = { size, speed, color, stroke };
      return <Grid {...gridProps} />;
    }

    // Default: ripples
    return <Hatch size={size} speed={speed} color={color} stroke={stroke} />;
  };

  return <div className={className}>{renderLoader()}</div>;
};

export default Loader;
