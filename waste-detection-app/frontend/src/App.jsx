import React, { useState } from 'react';
import Upload from './components/Upload';
import Results from './components/Results';

const App = () => {
    const [results, setResults] = useState(null);

    const handleResults = (data) => {
        setResults(data);
    };

    return (
        <div>
            <h1>Waste Detection App</h1>
            <Upload onResults={handleResults} />
            {results && <Results data={results} />}
        </div>
    );
};

export default App;