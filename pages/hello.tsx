import {useEffect, useState} from "react";

export default function Page() {
    const [connections, setConnections] = useState<string[]>([])
    useEffect(() => {
        fetch("/api/connections")
            .then(res => res.json())
            .then(data => setConnections(data.connections))
    }, []);
    return <div>{connections.join(", ")}</div>
}