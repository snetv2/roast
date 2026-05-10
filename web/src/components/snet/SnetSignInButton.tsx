type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export function SnetSignInButton({ onClick, disabled }: Props) {
  return (
    <button
      type="button"
      className="snet-signin-btn"
      onClick={onClick}
      disabled={disabled}
    >
      Continue with S NET
    </button>
  );
}
