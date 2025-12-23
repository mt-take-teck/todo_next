import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoList from "@/components/TodoList";

// localStorageのモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("TodoList", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe("初期表示", () => {
    it("空の状態でメッセージが表示される", () => {
      render(<TodoList />);
      expect(
        screen.getByText("タスクがありません。新しいタスクを追加してください。")
      ).toBeInTheDocument();
    });

    it("入力フィールドとボタンが表示される", () => {
      render(<TodoList />);
      expect(
        screen.getByPlaceholderText("新しいタスクを入力...")
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "追加" })).toBeInTheDocument();
    });
  });

  describe("タスクの追加", () => {
    it("ボタンクリックでタスクが追加される", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const input = screen.getByPlaceholderText("新しいタスクを入力...");
      const addButton = screen.getByRole("button", { name: "追加" });

      await user.type(input, "テストタスク");
      await user.click(addButton);

      expect(screen.getByText("テストタスク")).toBeInTheDocument();
      expect(input).toHaveValue("");
    });

    it("Enterキーでタスクが追加される", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const input = screen.getByPlaceholderText("新しいタスクを入力...");

      await user.type(input, "Enterで追加{enter}");

      expect(screen.getByText("Enterで追加")).toBeInTheDocument();
    });

    it("空の入力ではタスクが追加されない", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const addButton = screen.getByRole("button", { name: "追加" });
      await user.click(addButton);

      expect(
        screen.getByText("タスクがありません。新しいタスクを追加してください。")
      ).toBeInTheDocument();
    });

    it("空白のみの入力ではタスクが追加されない", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const input = screen.getByPlaceholderText("新しいタスクを入力...");
      const addButton = screen.getByRole("button", { name: "追加" });

      await user.type(input, "   ");
      await user.click(addButton);

      expect(
        screen.getByText("タスクがありません。新しいタスクを追加してください。")
      ).toBeInTheDocument();
    });
  });

  describe("タスクの完了", () => {
    it("チェックボックスでタスクが完了状態になる", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const input = screen.getByPlaceholderText("新しいタスクを入力...");
      await user.type(input, "完了テスト{enter}");

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(screen.getByText("1 / 1 完了")).toBeInTheDocument();
    });

    it("完了状態のタスクを未完了に戻せる", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const input = screen.getByPlaceholderText("新しいタスクを入力...");
      await user.type(input, "トグルテスト{enter}");

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
      expect(screen.getByText("0 / 1 完了")).toBeInTheDocument();
    });
  });

  describe("タスクの削除", () => {
    it("削除ボタンでタスクが削除される", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const input = screen.getByPlaceholderText("新しいタスクを入力...");
      await user.type(input, "削除テスト{enter}");

      expect(screen.getByText("削除テスト")).toBeInTheDocument();

      const deleteButton = screen.getByRole("button", { name: "削除" });
      await user.click(deleteButton);

      expect(screen.queryByText("削除テスト")).not.toBeInTheDocument();
      expect(
        screen.getByText("タスクがありません。新しいタスクを追加してください。")
      ).toBeInTheDocument();
    });
  });

  describe("複数タスクの管理", () => {
    it("複数のタスクを追加・管理できる", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const input = screen.getByPlaceholderText("新しいタスクを入力...");

      await user.type(input, "タスク1{enter}");
      await user.type(input, "タスク2{enter}");
      await user.type(input, "タスク3{enter}");

      expect(screen.getByText("タスク1")).toBeInTheDocument();
      expect(screen.getByText("タスク2")).toBeInTheDocument();
      expect(screen.getByText("タスク3")).toBeInTheDocument();
      expect(screen.getByText("0 / 3 完了")).toBeInTheDocument();
    });

    it("特定のタスクのみ完了・削除できる", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const input = screen.getByPlaceholderText("新しいタスクを入力...");

      await user.type(input, "タスクA{enter}");
      await user.type(input, "タスクB{enter}");

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(screen.getByText("1 / 2 完了")).toBeInTheDocument();

      const deleteButtons = screen.getAllByRole("button", { name: "削除" });
      await user.click(deleteButtons[0]);

      expect(screen.queryByText("タスクA")).not.toBeInTheDocument();
      expect(screen.getByText("タスクB")).toBeInTheDocument();
      expect(screen.getByText("0 / 1 完了")).toBeInTheDocument();
    });
  });

  describe("ローカルストレージ", () => {
    it("タスク追加時にローカルストレージに保存される", async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      const input = screen.getByPlaceholderText("新しいタスクを入力...");
      await user.type(input, "保存テスト{enter}");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "todos",
        expect.stringContaining("保存テスト")
      );
    });

    it("保存されたタスクが読み込まれる", () => {
      const savedTodos = [
        { id: 1, text: "保存済みタスク", completed: false },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedTodos));

      render(<TodoList />);

      expect(screen.getByText("保存済みタスク")).toBeInTheDocument();
    });
  });
});
