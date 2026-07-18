export default function InputError({ message, className = '', ...props }) {
    if (!message) return null;

    const displayMessage = Array.isArray(message) ? message[0] : message;

    return (
        <p
            {...props}
            className={'text-sm text-red-600 font-medium ' + className}
        >
            {displayMessage}
        </p>
    );
}
