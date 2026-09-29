

export function Modal({ isOpen }: { isOpen: boolean }) {
    if (!isOpen) return null;
    return <div role="dialog" aria-modal="true">Modal Content</div>;
}