import { vi } from "vitest";
import axios from "axios";
import { describe, it } from "vitest";
import UserList from "./UserList";
import { render } from "@testing-library/react";

vi.mock("axios")

describe("Axios Mocking", () => {

    it("API başarılı bir şekilde çağrılmalıdır", async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: { message: "Başarılı" } })

        render(<UserList />)
    })

})