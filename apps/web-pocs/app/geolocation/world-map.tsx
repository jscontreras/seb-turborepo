import Image from "next/image";

export default function WorldMap() {
  return (
    <div className="w-full flex items-center justify-center">
      <div className="relative w-full max-w-3xl aspect-square">
        <Image
          src="/mundi.webp"
          alt="World Map with Question Mark"
          fill
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}
