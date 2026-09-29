import React, {useState} from 'react'


interface AccordionProps {
    title: string;
    content: string
}

function Accordion({ title, content }: AccordionProps) {
    const [isOpen, setIsOpen] = useState(false)

    const toggleAccordion = () => {
        setIsOpen(!isOpen)
    }

    return (
        <div>
            <button onClick={toggleAccordion}>{title}</button>
            {isOpen && <p>{content}</p>}
        </div>
    )
}

export default Accordion