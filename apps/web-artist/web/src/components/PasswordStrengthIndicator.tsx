interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label = "Muy débil";
  let color = "bg-red-500";

  if (score >= 5) {
    label = "Muy fuerte";
    color = "bg-green-500";
  } else if (score >= 4) {
    label = "Fuerte";
    color = "bg-green-400";
  } else if (score >= 3) {
    label = "Media";
    color = "bg-yellow-500";
  } else if (score >= 2) {
    label = "Débil";
    color = "bg-orange-500";
  }

  return { score, label, color, requirements };
};

interface PasswordStrengthIndicatorProps {
  password: string;
  show: boolean;
}

export default function PasswordStrengthIndicator({ password, show }: PasswordStrengthIndicatorProps) {
  if (!show || !password) return null;

  const strength = calculatePasswordStrength(password);
  const percentage = (strength.score / 5) * 100;

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de progreso */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-700">
          <div
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 min-w-[80px]">
          {strength.label}
        </span>
      </div>

      {/* Requisitos */}
      <div className="text-xs space-y-1">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">Tu contraseña debe tener:</p>
        <ul className="space-y-0.5">
          <li className={strength.requirements.minLength ? "text-green-600 dark:text-green-400" : "text-zinc-500"}>
            {strength.requirements.minLength ? "✓" : "○"} Al menos 8 caracteres
          </li>
          <li className={strength.requirements.hasUpperCase ? "text-green-600 dark:text-green-400" : "text-zinc-500"}>
            {strength.requirements.hasUpperCase ? "✓" : "○"} Una letra mayúscula
          </li>
          <li className={strength.requirements.hasLowerCase ? "text-green-600 dark:text-green-400" : "text-zinc-500"}>
            {strength.requirements.hasLowerCase ? "✓" : "○"} Una letra minúscula
          </li>
          <li className={strength.requirements.hasNumber ? "text-green-600 dark:text-green-400" : "text-zinc-500"}>
            {strength.requirements.hasNumber ? "✓" : "○"} Un número
          </li>
          <li className={strength.requirements.hasSpecial ? "text-green-600 dark:text-green-400" : "text-zinc-500"}>
            {strength.requirements.hasSpecial ? "✓" : "○"} Un carácter especial (!@#$%...)
          </li>
        </ul>
      </div>
    </div>
  );
}
