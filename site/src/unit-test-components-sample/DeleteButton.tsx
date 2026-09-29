

interface Props {
    onConfirm: (id: string) => void;
    itemId: string;
}

export function DeleteButton({ onConfirm, itemId }: Props) {
    return (
        <button onClick={() => onConfirm(itemId)}>Delete</button>
    );
}