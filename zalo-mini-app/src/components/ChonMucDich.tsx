import React from "react";

export default function ChonMucDich({ giaTri, doi }: { giaTri: "ban" | "thue"; doi: (v: "ban" | "thue") => void }) {
  return (
    <div className="tab-md">
      <button className={giaTri === "ban" ? "bat" : ""} onClick={() => doi("ban")}>Mua bán</button>
      <button className={giaTri === "thue" ? "bat" : ""} onClick={() => doi("thue")}>Cho thuê</button>
    </div>
  );
}
