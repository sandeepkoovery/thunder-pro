import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, isError = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                `rounded-md shadow-sm focus:ring-indigo-500 ` +
                (isError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500 '
                    : 'border-gray-300 focus:border-indigo-500 ') +
                className
            }
            ref={localRef}
        />
    );
});
