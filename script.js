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
        // 显示图片  ch
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageUrl = event.target.result;
            const imageElement = document.createElement('img');
        	imageElement.id = 'showIMG'
        	//输出图片名字 ch
        	const resultDiv = document.getElementById('result');
        	const imageName = file.name
        	resultDiv.innerHTML += `<p>图片名称：${imageName}</p>`;
        	
            imageElement.src = imageUrl;
            fixedArea.innerHTML = '';
            fixedArea.appendChild(imageElement);
        };
        reader.readAsDataURL(file);
        //ch
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

        return `预处理后为：${modifiedParagraph}`; 
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
        
        // 检查标签内容是否为空，如果不为空，则显示标签内容
        if (label1.trim() !== '' || label2.trim() !== '') {
            const labelsDisplay = document.createElement('div');
            labelsDisplay.textContent = `文本类型: ${label1}, 主题类型: ${label2}`;
            textLabelingArea.appendChild(labelsDisplay);
        }
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
    const fileInput = document.getElementById('fileInput');

    if (type === 'type2') {
        // 如果当前类型为'type2'，则显示导入文本数据按钮
        fileInput.style.display = 'block';
    } else {
        // 对于其他类型，隐藏导入文本数据按钮
        fileInput.style.display = 'none';
    }
	
    // var allOptionsContent = document.querySelectorAll('.optionsContent');
    //     allOptionsContent.forEach(function (div) {
    //         div.style.display = 'none';
    //     });


    //     // 根据选中的 radio 按钮显示相应的 div
    //     var selectedDiv = document.getElementById(type + 'Div');
    //     if (selectedDiv) {
    //         selectedDiv.style.display = 'block';
    //     }


}
//文本标注结束

//-------------信息抽取------------------------------------------------------------
const FixedArea = document.getElementById('fixedArea');
const selectButton = document.getElementById('selectedButton');
const selectedTextDiv = document.getElementById('selectedText');
const annotationTextarea = document.getElementById('annotateTextarea');
const annotateButton = document.getElementById('annotateButton');

let selectedText = '';

// 获取用户选中的文本
function getSelectedText() {
        const selection = window.getSelection();
        return selection.toString();
}


// 添加划选按钮点击事件
selectButton.addEventListener('click', () => {
    // 获取用户选中的文本
    selectedText = getSelectedText();

    // 将选中的文本显示在 "划选 div" 中
    selectedTextDiv.value = selectedText;
});

// 添加标注按钮点击事件
annotateButton.addEventListener('click', () => {
    // 获取标注的内容
    const annotationText = annotationTextarea.value;

    // 在这里执行标注操作，例如弹出提示框
    alert(`标注选中文本：${selectedText}\n标注内容：${annotationText}`);

    // 清空选中的文本和标注内容
    selectedText = '';
    selectedTextDiv.textContent = '';
    annotationTextarea.value = '';
});
type1Div=document.getElementById('type1Div')
const Button1 = document.querySelector('.type1#Button1');
// 添加点击事件处理程序
Button1.addEventListener('click', () => {
    const confirmesc = confirm('请开始划选与标注');
    if (!confirmesc) {
        return;
    }
    type1Div.style.display='block';
    labelContainer.style.display = 'none'; // 隐藏标签库
    selectedLabelContainer.style.display = 'none';
    labelSelectionContainer.style.display = 'none';
});
//---------------------------------------yyx↓-------------------------------------------

// 获取“修改标签”按钮
const editLabelButton = document.querySelector('.type4#editLabelsButton'); // 这是“修改标签”按钮
const labelContainer = document.getElementById('labelContainer');
// 获取添加标签按钮和标签库容器
const selectLabelsButton = document.getElementById('selectLabelsButton');
const selectedLabelContainer = document.getElementById('selectedLabelContainer');
// 获取筛选输入框和已选标签容器
const selectedLabelFilter = document.getElementById('selectedLabelFilter');
const selectedLabelList = document.getElementById('selectedLabelList');
const labelSelectionContainer = document.getElementById('labelSelectionContainer');
const optionalLabelList = document.getElementById('optionalLabelList');

// 添加点击事件处理程序
editLabelButton.addEventListener('click', () => {
    const confirmesc = confirm('未保存的数据将全部丢失，确认离开吗？');
    if (!confirmesc) {
        return;
    }
    resetLabelCheckboxes();
    labelContainer.style.display = 'block'; // 显示标签库
    selectedLabelContainer.style.display = 'none';
    labelSelectionContainer.style.display = 'none';
    type1Div.style.display='none';
});

// 标签列表数据
let labels = ['标签1', '标签2', '标签3'];

// 获取标签列表的容器元素
const labelList = document.getElementById('labelList');
const filterInput = document.getElementById('filterInput');
const deleteSelectedButton = document.getElementById('deleteSelectedButton');

// 初始化标签列表
function initLabelList() {
    labelList.innerHTML = ''; // 清空标签列表

    labels.forEach((label, index) => {
        const labelItemb = document.createElement('div');
        labelItemb.className = 'label-item';
        labelItemb.innerHTML = `
            <label class="label">
                <input type="checkbox" class="label-checkbox">
                <span>${label}</span>
            </label>
        `;
        labelList.appendChild(labelItemb);
    });

    // 添加筛选标签事件监听器
    filterInput.addEventListener('input', filterLabels);

    // 添加删除选中标签按钮的点击事件处理程序
    deleteSelectedButton.addEventListener('click', confirmDeleteSelectedLabels);
}

// 添加新标签
function addNewLabel() {
    const newLabelInput = document.getElementById('newLabelInput');
    const newLabelName = newLabelInput.value.trim();

    if (newLabelName !== '') {
        // 检查新标签是否已存在
        if (labels.includes(newLabelName)) {
            alert('新标签已存在，请输入不同的标签。');
        } else {
            labels.push(newLabelName);
            newLabelInput.value = '';
            filterInput.value= "";
            initLabelList();
        }
    }
}

const inputEvent = new Event('input', {
  bubbles: true, // 事件是否冒泡
  cancelable: true, // 是否可以取消事件的默认行为
});

// 删除选中的标签
function deleteSelectedLabels() {
    const checkboxes = document.querySelectorAll('.label-checkbox');
    const selectedLabels = [];

    checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked) {
            selectedLabels.push(index);
        }
    });

    if (selectedLabels.length === 0) {
        alert('请先选择要删除的标签。');
        return;
    }

    const confirmDelete = confirm('确定要删除选中的标签吗？');

    if (confirmDelete) {
        selectedLabels.reverse().forEach(index => {
            labels.splice(index, 1);
        });
        initLabelList();
    }
}

// 筛选标签
function filterLabels() {
    const filterText = filterInput.value.toLowerCase();
    const labelItems = document.querySelectorAll('.label-item');
    
    labelItems.forEach((labelItem, index) => {
        const label = labels[index].toLowerCase();
        if (label.includes(filterText)) {
            labelItem.style.display = 'block';
        } else {
            labelItem.style.display = 'none';
        }
    });
}

// 添加点击事件处理程序
selectLabelsButton.addEventListener('click', () => {
    const confirmesc = confirm('未保存的数据将全部丢失，确认离开吗？');
    if (!confirmesc) {
        return;
    }
    // 清空筛选输入框
    filterInput.value = "";
    resetLabelCheckboxes();
    filterInput.dispatchEvent(inputEvent);
    labelContainer.style.display = 'none'; // 隐藏标签库
    type1Div.style.display='none';
    // 显示可选标签容器
    selectedLabelContainer.style.display = 'block';
    labelSelectionContainer.style.display = 'block';
    // 复制标签列表到可选标签容器
    const clonedLabelList = labelList.cloneNode(true);
    
    selectedLabelContainer.innerHTML = `
    <h2>可选标签</h2>
    <input type="text" id="selectedLabelFilter" placeholder="筛选可选标签">
    </div>
    <br> <!-- 在这里添加换行 -->
    `;
    clonedLabelList.id = 'selectedLabelList';
    selectedLabelContainer.appendChild(clonedLabelList);
    
    // 获取所有标签复选框
    const checkboxesq = document.querySelectorAll('.label-checkbox');

    checkboxesq.forEach((checkbox) => {
        const labelName = checkbox.nextElementSibling.textContent;

        if (reservedLabels.includes(labelName)) {
            checkbox.checked = true;
        } else {
            checkbox.checked = false;
        }
    });

    const selectedLabelFilter = document.getElementById('selectedLabelFilter');
    selectedLabelFilter.addEventListener('input', () => {
        const filterTexta = selectedLabelFilter.value.toLowerCase();
        const labelItemsa = clonedLabelList.querySelectorAll('.label-item');

        labelItemsa.forEach((labelItem) => {
            const labelText = labelItem.textContent.toLowerCase();
            if (labelText.includes(filterTexta)) {
                labelItem.style.display = 'block';
            } else {
                labelItem.style.display = 'none';
            }
        });
    });
});

// 获取“更新”按钮元素
const updateLabelsButton = document.getElementById('updateLabelsButton');

// 添加点击事件处理程序
updateLabelsButton.addEventListener('click', () => {
    // 获取所有可选标签的复选框
    const checkboxes = document.querySelectorAll('#selectedLabelList .label-checkbox');
    
    // 清空已选标签列表
    optionalLabelList.innerHTML = '';

    // 遍历复选框，将勾选的标签添加到已选标签列表
    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            const labelName = checkbox.nextElementSibling.textContent;
            const labelItem = document.createElement('div');
            labelItem.className = 'label-item';
            labelItem.innerHTML = `
            <label class="label">
                <span>${labelName}</span>
            </label>
            `;
            optionalLabelList.appendChild(labelItem);
        }
    });
});

// 声明一个数组来存储选中的标签
const reservedLabels = [];

// 获取"设为预定"按钮元素
const reserveLabelsButton = document.getElementById('reserveLabelsButton');

// 添加"设为预定"按钮点击事件处理程序
reserveLabelsButton.addEventListener('click', () => {
    // 获取所有标签复选框
    const checkboxes = document.querySelectorAll('.label-checkbox');

    // 清空已选标签数组
    reservedLabels.length = 0;

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            const labelName = checkbox.nextElementSibling.textContent;
            reservedLabels.push(labelName);
        }
    });

    // 已预定标签设为粗体
    checkboxes.forEach((checkbox) => {
        const labelName = checkbox.nextElementSibling.textContent;
        const labelItem = checkbox.closest('.label-item');
        
        if (reservedLabels.includes(labelName)) {
            labelItem.style.fontWeight = 'bold';
        } else {
            labelItem.style.fontWeight = 'normal';
        }
    });
});

//---- 初始化标签列表 -----------------------------------------------------
initLabelList();

//---- 取消全部勾选 ----------------------------------------
function resetLabelCheckboxes() {
    const checkboxes = document.querySelectorAll('.label-checkbox');

    checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
    });
}

//---------------------------------------yyx↑-------------------------------------------



// 标注图片的函数    ch
function annotateImage() {
	const resultDiv = document.getElementById('result');
	resultDiv.innerHTML += `<p>已自动对图片进行处理标记</p>`;
	
	
	const imageName = getImageName(src);
	// 输出图片名称
	//console.log('图片名称:', imageName);
	resultDiv.innerHTML += `<p>图片名称:  ${imageName}   </p>`;


    // 获取 canvas 元素
    const canvas = document.getElementById('canvas');
	
	
    // 获取 2D 上下文
    const ctx = canvas.getContext('2d');

    // 在画布上绘制标注
    ctx.font = '20px Arial'; // 设置字体样式
    ctx.fillStyle = 'red';   // 设置文本颜色
    ctx.fillText('这是标注', 50, 50); // 绘制文本，位置为 (50, 50)
}

function annotateImage1() {
    // const container = document.getElementById('annotationContainer');
	const container = document.getElementById('showIMG');
	const containerWidth = container.clientWidth;
	const containerHeight = container.clientHeight;
	const imgsrc = container.src;
	fixedArea.innerHTML = '<canvas id="canvas" ></canvas>';
	
	const canvas = document.getElementById('canvas');
	canvas.width = containerWidth;
	canvas.height = containerHeight;
	const imageElement1 = document.createElement('img');
	imageElement1.id = 'showIMG'
	imageElement1.src = imgsrc;
	
    const ctx = canvas.getContext('2d');
    let points = [];
    let drawing = false;
	
	imageElement1.onload = function(){
		ctx.drawImage(imageElement1, 0, 0, containerWidth, containerHeight);
	}
	
	 
    // 监听鼠标点击事件
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
		
		//const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (points.length < 4) {
            points.push({ x, y });
            drawPoint(x, y);
        }

        if (points.length === 4) {
            drawBoundingBox();
            points = [];
        }
    });
	


    // 绘制点击的点
    function drawPoint(x, y) {
        ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
	
	

	let index=0;
    // 绘制标记框
    function drawBoundingBox() {
		const resultDiv = document.getElementById('result');
		
        if (points.length === 4) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.lineTo(points[2].x, points[2].y);
            ctx.lineTo(points[3].x, points[3].y);
			resultDiv.innerHTML += `<p>标记框${index}：</p>`;
			resultDiv.innerHTML += `<p>1坐标: (${points[0].x} , ${points[0].y})</p>`;
			resultDiv.innerHTML += `<p>2坐标: (${points[1].x} , ${points[1].y})</p>`;
			resultDiv.innerHTML += `<p>3坐标: (${points[2].x} , ${points[2].y})</p>`;
			resultDiv.innerHTML += `<p>4坐标: (${points[3].x} , ${points[3].y})</p>`;
            ctx.closePath();
            ctx.stroke();
			index++;
			
        }
    }
	
	
}
//ch
