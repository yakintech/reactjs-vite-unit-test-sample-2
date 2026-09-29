import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TaskList } from "./TaskList";


describe("Within Hilesi", () => {

    it("Sadece ikinci taskın sil butonuna tıklanmalıdır", async () => {
        const user = userEvent.setup()
        render(<TaskList />)

        // screen.getByRole("button", {name: "Delete Task})

        //Önce ikinci taskın kapsayıcısını seçelim
        const secondTask = screen.getByTestId("task-item-2")

        //within ile sadece ikinci taskın kapsayıcısı içinde arama yapıyoruz
        const deleteButton = within(secondTask).getByRole("button", {name: "Delete Task"})

        await user.click(deleteButton)
    
    

    })

})