
// 初始化默认选中类型的按钮
showButtons('type1');
//showButtons函数放在文本标注的最后

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
				importTextData(file);
				
				
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


//文本标注
// 定义全局变量以存储文本数据和标签
let textData = '';
let definedLabels = [];

// 导入文本数据的函数
function importTextData(file) {
    const reader = new FileReader();
    reader.onload = function () {
        textData = reader.result;
        preLabelTextData(textData); // 对导入的文本数据进行预标注
    };
    reader.readAsText(file);
	handleTextFile(file);
}

// 文件输入的事件监听器，用于导入文本数据
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = function () {
            const text = reader.result;
            if (text.length <= 100) {
                importTextData(file);
            } else {
                alert('文本过长，应少于100个字符');
            }
        };
        reader.readAsText(file);
    } else {
        alert('请上传一个文本文件。');
    }
});


// 对文本数据进行预标注的函数
function preLabelTextData(text) {
    const paragraphs = text.split('\n'); // 根据换行符将文本拆分成段落

    const modifiedParagraphs = paragraphs.map(paragraph => {
        let modifiedParagraph = '';

        for (let i = 0; i < paragraph.length; i++) {
            modifiedParagraph += paragraph[i];

            // 检查字符是否为数字（0-9）
            if (!isNaN(parseInt(paragraph[i], 10))) {
                modifiedParagraph += ' '; // 显示数字后添加一个空格
            }
        }

        return modifiedParagraph;
    });

    displayTextForLabeling(modifiedParagraphs);
}




// 用于显示文本内容以供手动标注的函数
function displayTextForLabeling(paragraphs) {
    const textLabelingArea = document.getElementById('textLabelingArea');
    textLabelingArea.innerHTML = ''; // 清空之前的内容
    
    // 显示供手动标注的段落
    paragraphs.forEach((paragraph, index) => {
        const paragraphDiv = document.createElement('div');
        paragraphDiv.textContent = paragraph;
        paragraphDiv.classList.add('paragraph');
        
        // 为每个段落创建标签选择下拉框
        const labelSelect = document.createElement('select');
        labelSelect.classList.add('label-select');
        definedLabels.forEach((label) => {
            const option = document.createElement('option');
            option.value = label;
            option.textContent = label;
            labelSelect.appendChild(option);
        });
        
        // 事件监听器以捕获每个段落的选择标签
        labelSelect.addEventListener('change', (e) => {
            const selectedLabel = e.target.value;
            // 根据需要存储或处理所选标签和段落索引
            console.log(`第 ${index + 1} 段标记为：${selectedLabel}`);
        });

        // 将段落和标签选择下拉框追加到文本标注区域
        textLabelingArea.appendChild(paragraphDiv);
        textLabelingArea.appendChild(labelSelect);

   
    });
}

function submitForm() {
    // 获取当前选择的标注类型
    const currentType = getCurrentAnnotationType();

    // 如果当前标注类型为type2，则显示标签内容
    if (currentType === 'type2') {
        const label1 = document.getElementById('label1').value;
        const label2 = document.getElementById('label2').value;

        const textLabelingArea = document.getElementById('textLabelingArea');
        const labelsDisplay = document.createElement('div');
        labelsDisplay.textContent = `文本类型: ${label1}, 主题类型: ${label2}`;
        textLabelingArea.appendChild(labelsDisplay);
    }
}

const submitButton = document.querySelector('.submit-button');
submitButton.addEventListener('click', submitForm);


function showButtons(type) {
    // 隐藏所有按钮	
    document.querySelectorAll('#sidebar button').forEach(button => {
        button.style.display = 'none';
    });

    // 显示所选类型的按钮（除了type2）
    if (type !== 'type2') {
        document.querySelectorAll('#sidebar .' + type).forEach(button => {
            button.style.display = 'block';
        });
    }

    // 获取文本和主题标签的元素
    const label1Label = document.querySelector('label[for="label1"]');
    const label1Input = document.getElementById('label1');
    const label2Label = document.querySelector('label[for="label2"]');
    const label2Input = document.getElementById('label2');

    if (type === 'type2' && document.querySelector('#sidebar button.type2:nth-child(3)')) {
        // 显示文本和主题标签及其输入字段
        label1Label.style.display = 'inline-block';
        label1Input.style.display = 'inline-block';
        label2Label.style.display = 'inline-block';
        label2Input.style.display = 'inline-block';
    } else {
        // 隐藏文本和主题标签及其输入字段
        label1Label.style.display = 'none';
        label1Input.style.display = 'none';
        label2Label.style.display = 'none';
        label2Input.style.display = 'none';
    }
	
}
//文本标注结束
