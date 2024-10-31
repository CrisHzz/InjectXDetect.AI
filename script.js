let model;
const windowSize = 25; // Asegúrate de usar el mismo tamaño de ventana que tu modelo

async function loadModel() {
    model = await tf.loadLayersModel('modelJSON/model.json');
    console.log("Model loaded successfully.");
}

async function predictFromCSV() {
    if (!model) {
        alert("Model is not loaded yet. Please wait.");
        return;
    }
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    const loadingElement = document.getElementById('loading');
    const resultElement = document.getElementById('result');
    
    if (!file) {
        alert("Please upload a CSV file first.");
        return;
    }

    loadingElement.style.display = 'block';
    resultElement.innerText = '';

    try {
        const text = await file.text();
        const data = parseCSV(text);
        const processedData = processData(data);

        const predictionTensor = model.predict(tf.tensor(processedData, [processedData.length, windowSize, 3]));
        const predictions = await predictionTensor.array();
        const meanPrediction = predictions.flat().reduce((acc, val) => acc + val) / predictions.length;

        const result = meanPrediction > 0.5 ? "Human" : "Not Human (you are being hacked dude)";

        try {
            const response = await fetch('https://hendpoint.onrender.com/api/insert/' + result, { method: "POST" });
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error("Error sending message to Telegram:", error);
        }
        resultElement.innerText = "Prediction: " + result;
    } catch (error) {
        console.error("Error during prediction:", error);
        resultElement.innerText = "An error occurred during prediction. Please try again.";
    } finally {
        loadingElement.style.display = 'none';
    }
}
function parseCSV(text) {
    const lines = text.split('\n');
    return lines.slice(1).map(line => {
        const [, interval, charsPerSecond, errorCount] = line.split(',');
        return {
            Interval_ms: parseFloat(interval.replace(',', '.')),
            Chars_per_Second: parseFloat(charsPerSecond.replace(',', '.')),
            Error_Count: parseFloat(errorCount.replace(',', '.'))
        };
    });
}

function processData(data) {
    return data.map((row, i, arr) => 
        i + windowSize <= arr.length ? arr.slice(i, i + windowSize).map(r => [r.Interval_ms, r.Chars_per_Second, r.Error_Count]) : null
    ).filter(seq => seq);
}

loadModel();
loadModel().then(() => {
    document.getElementById('csvFile').addEventListener('change', function(e) {
        const fileName = e.target.files[0]?.name || 'Choose CSV File';
        document.querySelector('.file-input-label').textContent = fileName;
    });
});
document.getElementById('csvFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0]?.name || 'Choose CSV File';
    document.querySelector('.file-input-label').textContent = fileName;
});
