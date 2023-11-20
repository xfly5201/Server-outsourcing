function showButtons(type) {
    // 隐藏所有按钮
    document.querySelectorAll('#sidebar button').forEach(button => {
        button.style.display = 'none';
    });

    // 显示所选类型的按钮
    document.querySelectorAll('#sidebar .' + type).forEach(button => {
        button.style.display = 'block';
    });
}

// 初始化默认选中类型的按钮
showButtons('type1');


// 根据所选的标注类型设置允许的文件类型
function getAllowedFileTypes(annotationType) {
    switch (annotationType) {
        case 'type1':
            return ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        case 'type2':
            return ['text/plain'];
        case 'type3':
        case 'type4':
            return ['image/jpeg', 'image/jpg', 'image/bmp', 'image/png', 'application/pdf'];
        default:
            return [];
    }
}

// 获取当前选择的标注类型
function getCurrentAnnotationType() {
    const checkedRadio = document.querySelector('input[name="annotationType"]:checked');
    return checkedRadio ? checkedRadio.id : '';
}

const fileDropArea = document.getElementById('fileDropArea');
const fixedArea = document.getElementById('fixedArea');

fileDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropArea.classList.add('dragover');
});

fileDropArea.addEventListener('dragleave', () => {
    fileDropArea.classList.remove('dragover');
});

fileDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        const allowedFileTypes = getAllowedFileTypes(getCurrentAnnotationType());

        if (allowedFileTypes.includes(file.type)) {
            if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                handleWordFile(file);
            } else if (file.type === 'text/plain' && getCurrentAnnotationType() === 'type2') {
                handleTextFile(file);
            } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                handleImageOrPdfFile(file);
            }
        } else {
            alert('不支持的文件格式');
        }
    }
});

function handleTextFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        if (text.length <= 100) {
            fixedArea.textContent = text;
        } else {
            alert('文本过长，应少于100个字符');
        }
    };
    reader.readAsText(file);
}

function handleImageOrPdfFile(file) {
    if (file.type === 'application/pdf') {
        // 处理PDF文件
        const reader = new FileReader();
        reader.onload = function () {
            const typedarray = new Uint8Array(this.result);

            pdfjsLib.getDocument({data: typedarray}).promise.then(function (pdf) {
                // 假设您只想显示第一页
                pdf.getPage(1).then(function (page) {
                    const scale = 1.5;
                    const viewport = page.getViewport({scale: scale});

                    // 准备用于渲染的canvas元素
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    // 将PDF页面渲染到canvas上
                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext);

                    // 将canvas添加到DOM中
                    fixedArea.innerHTML = '';
                    fixedArea.appendChild(canvas);
                });
            });
        };
        reader.readAsArrayBuffer(file);
    } else {
        // 显示图片
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target.result;
            const imageElement = document.createElement('img');
            imageElement.src = imageUrl;
            fixedArea.innerHTML = '';
            fixedArea.appendChild(imageElement);
        };
        reader.readAsDataURL(file);
    }
}

function handleWordFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const arrayBuffer = event.target.result;

        mammoth.convertToHtml({arrayBuffer: arrayBuffer})
            .then(function (result) {
                fixedArea.innerHTML = result.value;
            })
            .catch(function (error) {
                console.error('Word文档解析错误', error);
                alert('Word文档解析失败');
            });
    };
    reader.readAsArrayBuffer(file);
}










