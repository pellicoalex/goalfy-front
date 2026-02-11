import { Sparkles } from "lucide-react";

function TechTag(props: { children: React.ReactNode }) {
  return (
    <span
      className="gradient-primary inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-widest"
      style={{
        color: "#FBFAFA",
        boxShadow: "0 10px 24px -16px rgba(2,160,221,0.65)",
      }}
    >
      <Sparkles className="h-3 w-3" />
      {props.children}
    </span>
  );
}

export default TechTag;
