import tkinter as tk
from tkinter import ttk, font

DEFAULT_TEXT = """SHE HAD AN AFFAIR
WITH MY CLOSE FRIEND
IT BROKE MY HEART
I TRIED FIXING US
FOR OUR FAMILY'S FUTURE
I KEPT ON TRYING
THEN I REVEALED
I'M A MILLIONAIRE"""

class ThumbnailApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        root.title("Thumbnail Editor")

        self.font_var = tk.StringVar(value="Impact")
        self.scale_var = tk.DoubleVar(value=1.0)
        self.text_pos = [0, 0]
        self.drag_data: dict | None = None
        self.edit_slider: tk.Scale | None = None

        self.text_input = tk.Text(root, wrap="word", height=5)
        self.text_input.insert("1.0", DEFAULT_TEXT)
        self.text_input.pack(fill="x", padx=10, pady=10)

        font_frame = tk.Frame(root)
        font_frame.pack(fill="x", pady=5)
        tk.Label(font_frame, text="Font:").pack(side="left")
        system_fonts = sorted(font.families())
        self.font_combo = ttk.Combobox(font_frame, textvariable=self.font_var, values=system_fonts)
        self.font_combo.bind("<<ComboboxSelected>>", self.update_preview)
        self.font_combo.pack(side="left", fill="x", expand=True, padx=5)
        tk.Button(font_frame, text="Edit", command=self.toggle_edit).pack(side="left", padx=5)

        self.canvas = tk.Canvas(root, width=960, height=540, bg="white")
        self.canvas.pack(fill="both", expand=True, padx=10, pady=10)
        self.canvas_text = self.canvas.create_text(0, 0, anchor="nw", text="", font=self.current_font())

        self.text_input.bind("<<Modified>>", self.update_preview)
        self.update_preview()

    def current_font(self) -> font.Font:
        size = int(40 * self.scale_var.get())
        family = self.font_var.get() or "Impact"
        return font.Font(family=family, size=size, weight="bold")

    def update_preview(self, *_):
        self.text_input.edit_modified(False)
        text = self.text_input.get("1.0", "end-1c")
        self.canvas.itemconfigure(self.canvas_text, text=text, font=self.current_font())
        self.canvas.coords(self.canvas_text, *self.text_pos)

    def toggle_edit(self):
        if self.drag_data:
            # Disable edit mode
            self.canvas.unbind("<ButtonPress-1>")
            self.canvas.unbind("<B1-Motion>")
            self.canvas.unbind("<ButtonRelease-1>")
            self.drag_data = None
            if self.edit_slider is not None:
                self.edit_slider.destroy()
                self.edit_slider = None
        else:
            # Enable edit mode
            self.drag_data = {"x": 0, "y": 0}
            self.canvas.bind("<ButtonPress-1>", self.on_press)
            self.canvas.bind("<B1-Motion>", self.on_drag)
            self.canvas.bind("<ButtonRelease-1>", self.on_release)
            self.edit_slider = tk.Scale(self.root, from_=0.5, to=3.0, resolution=0.1,
                                        orient="horizontal", variable=self.scale_var,
                                        label="Scale", command=lambda _: self.update_preview())
            self.edit_slider.pack(fill="x", padx=10)

    def on_press(self, event):
        self.drag_data["x"] = event.x
        self.drag_data["y"] = event.y

    def on_drag(self, event):
        dx = event.x - self.drag_data["x"]
        dy = event.y - self.drag_data["y"]
        self.canvas.move(self.canvas_text, dx, dy)
        self.text_pos[0] += dx
        self.text_pos[1] += dy
        self.drag_data["x"] = event.x
        self.drag_data["y"] = event.y

    def on_release(self, _event):
        pass


def main():
    root = tk.Tk()
    ThumbnailApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
