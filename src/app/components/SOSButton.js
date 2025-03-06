import React from "react";

const SOSButton = () => {
  const emergencyNumber = "+1234567890"; // Replace with actual emergency contact

  const sendEmergencyMessage = () => {
    const message = encodeURIComponent("🚨 Emergency! I'm experiencing a severe anxiety attack. Please help!");
    const whatsappUrl = `https://wa.me/${emergencyNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <button
      onClick={sendEmergencyMessage}
      style={{
        backgroundColor: "red",
        color: "white",
        padding: "15px",
        borderRadius: "10px",
        fontSize: "18px",
        cursor: "pointer",
        marginTop: "10px",
      }}
    >
      🚨 SOS Emergency
    </button>
  );
};

export default SOSButton;
