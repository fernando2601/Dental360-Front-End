import React from "react";
import antesImg from "../assets/antes.jpg";
import depoisImg from "../assets/depois.png";

export const HarmonyBeforeImage = () => {
  return <img src={antesImg} alt="Antes da harmonização facial" className="w-full h-full object-contain" />;
};

export const HarmonyAfterImage = () => {
  return <img src={depoisImg} alt="Depois da harmonização facial" className="w-full h-full object-contain" />;
};