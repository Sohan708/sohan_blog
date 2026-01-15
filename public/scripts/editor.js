(function () {
  if (typeof window.Quill === 'undefined') {
    return;
  }

  const textarea = document.getElementById('content');
  const editorContainer = document.getElementById('editor');
  if (!textarea || !editorContainer) {
    return;
  }

  const quill = new window.Quill(editorContainer, {
    theme: 'snow',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'link'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['image', 'code-block'],
        [{ align: [] }]
      ]
    }
  });

  quill.root.innerHTML = textarea.value || '';

  const form = textarea.closest('form');
  if (form) {
    form.addEventListener('submit', (event) => {
      const html = quill.root.innerHTML;
      textarea.value = html;
      const isEmpty = html === '<p><br></p>' || html.trim() === '';
      if (isEmpty) {
        event.preventDefault();
        alert('Content is required.');
      }
    });
  }

  const toolbar = quill.getModule('toolbar');
  if (toolbar) {
    toolbar.addHandler('image', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.click();
      input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        if (!file) {
          return;
        }
        const formData = new FormData();
        formData.append('file', file);
        try {
          const response = await fetch('/admin/editor/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          const data = await response.json();
          if (!data.url) {
            throw new Error('Invalid response');
          }
          const range = quill.getSelection(true);
          const index = range ? range.index : quill.getLength();
          quill.insertEmbed(index, 'image', data.url, 'user');
        } catch (error) {
          console.error(error);
          alert('Image upload failed');
        }
      });
    });
  }

  quill.root.addEventListener('paste', (event) => {
    if (!event.clipboardData) {
      return;
    }
    const text = event.clipboardData.getData('text/plain');
    if (!text) {
      return;
    }
    event.preventDefault();
    let normalized = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .join('\n')
      .trim();
    normalized = normalized.replace(/([।!?])(?=\S)/g, '$1 ');
    const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
    quill.insertText(range.index, normalized, 'user');
    quill.setSelection(range.index + normalized.length, 0, 'user');
  });
})();
