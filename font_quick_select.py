import tkinter as tk
from tkinter import ttk
from tkinter import font as tkfont

class FontQuickSelectApp(tk.Tk):
    """Simple GUI for quickly previewing system fonts."""

    def __init__(self):
        super().__init__()
        self.title("Font Quick Selector")
        self.geometry("800x600")

        self.available_fonts = sorted(tkfont.families())

        self.search_var = tk.StringVar()
        self.search_var.trace_add('write', self.filter_fonts)
        search_entry = ttk.Entry(self, textvariable=self.search_var)
        search_entry.pack(fill='x', padx=10, pady=5)
        search_entry.insert(0, "Search font...")

        self.font_var = tk.StringVar()
        self.font_combo = ttk.Combobox(self, textvariable=self.font_var, values=self.available_fonts, state='normal')
        self.font_combo.pack(fill='x', padx=10, pady=5)
        self.font_combo.bind('<<ComboboxSelected>>', self.update_preview)

        self.text = tk.Text(self, wrap='word', font=(self.font_var.get() or 'Arial', 20))
        self.text.pack(expand=True, fill='both', padx=10, pady=10)
        self.text.insert('1.0', 'Type your text here...')

        self.font_var.trace_add('write', lambda *args: self.update_preview())

    def filter_fonts(self, *_):
        typed = self.search_var.get().lower()
        filtered = [f for f in self.available_fonts if typed in f.lower()]
        self.font_combo['values'] = filtered

    def update_preview(self, *_):
        try:
            self.text.configure(font=(self.font_var.get(), 20))
        except tk.TclError:
            pass

if __name__ == '__main__':
    app = FontQuickSelectApp()
    app.mainloop()

