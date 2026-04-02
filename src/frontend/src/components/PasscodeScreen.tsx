import { Button } from "@/components/ui/button";
import { Lock, TreePine } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const CORRECT_PASSCODE = "6891";

interface PasscodeScreenProps {
  onUnlock: () => void;
}

export default function PasscodeScreen({ onUnlock }: PasscodeScreenProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const inputRefs = [ref0, ref1, ref2, ref3];

  useEffect(() => {
    ref0.current?.focus();
  }, []);

  const checkCode = (code: string) => {
    if (code === CORRECT_PASSCODE) {
      onUnlock();
    } else {
      setError("Incorrect passcode");
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setDigits(["", "", "", ""]);
        ref0.current?.focus();
      }, 600);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    setError("");

    if (clean && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (index === 3 && clean) {
      const code = newDigits.join("");
      if (code.length === 4) {
        setTimeout(() => checkCode(code), 50);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === "Enter") {
      submitCode();
    }
  };

  const submitCode = () => {
    const code = digits.join("");
    if (code.length === 4) {
      checkCode(code);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "oklch(0.18 0.06 175)" }}
      data-ocid="passcode.page"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="bg-card rounded-xl shadow-2xl p-10 w-[360px] flex flex-col items-center gap-6"
          data-ocid="passcode.dialog"
        >
          {/* Logo / icon */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.38 0.09 175 / 0.12)" }}
            >
              <TreePine
                className="w-7 h-7"
                style={{ color: "oklch(0.38 0.09 175)" }}
              />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Travel Log
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your passcode to continue
            </p>
          </div>

          {/* PIN inputs */}
          <div className="flex gap-3" data-ocid="passcode.input">
            {digits.map((d, i) => (
              <input
                // biome-ignore lint/suspicious/noArrayIndexKey: PIN digit positions are fixed
                key={i}
                ref={inputRefs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-14 h-14 text-center text-2xl font-bold rounded-lg border-2 outline-none transition-all"
                style={{
                  borderColor: error
                    ? "oklch(0.577 0.245 27.325)"
                    : d
                      ? "oklch(0.38 0.09 175)"
                      : "oklch(0.88 0.035 75)",
                  background: "oklch(0.98 0.015 85)",
                  color: "oklch(0.18 0.06 175)",
                }}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium"
              style={{ color: "oklch(0.577 0.245 27.325)" }}
              data-ocid="passcode.error_state"
            >
              {error}
            </motion.p>
          )}

          {/* Unlock button */}
          <Button
            type="button"
            onClick={submitCode}
            className="w-full rounded-full font-semibold text-sm h-11"
            disabled={digits.join("").length !== 4}
            data-ocid="passcode.submit_button"
          >
            <Lock className="w-4 h-4 mr-2" />
            Unlock
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
