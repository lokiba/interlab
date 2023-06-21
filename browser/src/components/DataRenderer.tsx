import { Button } from "@mui/material";


const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];

export function DataRenderer(props: { data: any, uid: string, opened: Set<string>, toggleOpen: (uid: string) => void, hideType?: string }) {
    let d = props.data;
    if (d === null) {
        return <span>None</span>
    }
    if (typeof d === 'boolean') {
        return <span>{d ? "true" : "false"}</span>
    }
    if (typeof d === 'number') {
        return <span>{d}</span>
    }
    if (typeof d === 'string') {
        if (d.length < 64 && !/\r|\n/.exec(d)) {
            return <span>{d}</span>
        } else {
            const lines = d.split(/\r\n|\r|\n/);
            if (lines.length <= 5) {
                return <div style={{ whiteSpace: "pre-wrap" }}>{d}</div>
            } else {
                if (props.opened.has(props.uid)) {
                    return <>
                        <div style={{ whiteSpace: "pre-wrap" }}>{d}</div>
                        <Button onClick={() => props.toggleOpen(props.uid)}>Hide lines</Button>
                    </>
                } else {
                    return <>
                        <div style={{ whiteSpace: "pre-wrap" }}>{lines.slice(0, 3).join("\n")} ...</div>
                        <Button onClick={() => props.toggleOpen(props.uid)}>Show {lines.length} lines</Button>
                    </>
                }
            }
        }
    }

    if (d._type === "Blob" && IMAGE_MIME_TYPES.includes(d.mime_type)) {
        const data = `data:${d.mime_type};base64, ${d.data}`;
        // eslint-disable-next-line jsx-a11y/alt-text
        return <div><img src={data} /></div>
    }

    const children = [];
    let type = null;
    for (const property in d) {
        const value = d[property];
        if (property === "_type") {
            type = value;
            continue;
        }
        children.push({ property: property, value: value });
    }

    const isLong = children.length > 3;

    if (isLong && !props.opened.has(props.uid)) {
        return <>
            {(props.hideType !== type && type) && <span>{type}</span>}
            <Button onClick={() => props.toggleOpen(props.uid)}>Show {children.length} items</Button>
        </>
    }

    return (<>
        {(props.hideType !== type && type) && <span>{type}</span>}
        {isLong && <Button onClick={() => props.toggleOpen(props.uid)}>Hide items</Button>}
        <ul>
            {children.map(({ property, value }) => <li key={property}><strong>{property}</strong>: <DataRenderer uid={props.uid + "/" + property} data={value} opened={props.opened} toggleOpen={props.toggleOpen} /></li>)}
        </ul></>);
}