import { pickMember } from "../../core/rotationFacade";
import { type ShiftKey } from "../../core/shiftRows";
export function ShiftCellLinear({
  day,
  shiftKey,
  members,
  year,
  monthIndex0,
  mode,
  anchorDateYmd,
  offsetFromTripByKey,
  highlightName,
}: {
  day: number;
  shiftKey: ShiftKey;
  members: readonly string[];
  year: number;
  monthIndex0: number;
  mode: "temp" | "anchor";
  anchorDateYmd?: string;
  offsetFromTripByKey: Record<ShiftKey, number>;
  highlightName?: string;
}) {

  const date = new Date(year, monthIndex0, day);
  const picked = pickMember({
    date,
    day,
    shiftKey,
    members,
    mode,
    anchorDateYmd,
    offsetFromTripByKey,
  });

  const isOff = shiftKey.startsWith("off");
  const isTrip = shiftKey === "trip";
  const isMine = !!highlightName && picked === highlightName;

  // 背景は “1つだけ” 決める
  const bgClass = isMine
    ? (isOff ? "bg-lime-200" : "bg-yellow-200")
    : (isTrip ? "bg-blue-50" : isOff ? "bg-neutral-50" : "bg-white");

  // 文字色も必要ならここで（背景と同じく “1つだけ”）
  const textClass = isMine && isOff ? "text-red-600" : "text-black";

  return (
    <div
      className={[
        "border-b border-neutral-200 px-1 py-0 text-lg font-medium leading-tight",
        bgClass,
        textClass,
      ].join(" ")}
    >
      <div className="truncate w-full text-center">{picked}</div>
    </div>
  );
}