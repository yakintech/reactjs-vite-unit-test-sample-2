import { describe,expect,it } from "vitest";
import Search from "./Search";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";


describe("Search Component", () => {

    // fireEvent ile test
    it("Search input should update value on change", () => {
        render(<Search />)
        const input = screen.getByPlaceholderText("Search...")
        fireEvent.change(input, { target: { value: "test" } })
        expect(screen.getByText("Searching for: test")).toBeInTheDocument()
    })

    //userEvent ile test
    // it("Search input should update value on change using userEvent", async () => {
    //     render(<Search />)

    //     const user = userEvent.setup()
    //     const input = screen.getByPlaceholderText("Search...")
    //     await user.type(input, "user test")
        
    //     expect(screen.getByText("Searching for: user test")).toBeInTheDocument()
    // })

})