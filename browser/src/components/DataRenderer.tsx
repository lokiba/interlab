import { Box, Button } from "@mui/material";
import { BrowserEnv, OpenerMode } from "./DataBrowser";
import parse from 'html-react-parser';

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];


type TracebackFrame = {
    line: string,
    name: string,
    filename: string,
    lineno: number,
}

function Frame(props: { frame: TracebackFrame }) {
    return <Box sx={{ mb: 0.2 }}>
        <Box>
            File <strong>{props.frame.filename}</strong>, line <strong>{props.frame.lineno}</strong>, in <strong>{props.frame.name}</strong>
        </Box>
        <Box sx={{ ml: 3, color: "#dd5555" }}>
            <strong>{props.frame.line}</strong>
        </Box>
    </Box >
}

function Traceback(props: { env: BrowserEnv, frames: TracebackFrame[], uid: string }) {
    let frames = props.frames;
    if (!frames || !(frames.length >= 1)) {
        return <span>Invalid traceback</span>
    }
    const isOpened = props.env.opened.has(props.uid);
    if (!isOpened) {
        frames = frames.slice(-2);
    }

    return <><Box sx={{ fontFamily: 'Monospace' }}>
        {frames.map((frame, i) => <Frame frame={frame} key={i} />)}
    </Box>
        {props.frames.length > 2 && isOpened && <Button onClick={() => props.env.setOpen(props.uid, OpenerMode.Close)}>Hide full traceback</Button>}
        {props.frames.length > 2 && !isOpened && <Button onClick={() => props.env.setOpen(props.uid, OpenerMode.Open)}> Show all {props.frames.length} frames</Button>}
    </>

}

export function DataRenderer(props: { env: BrowserEnv, data: any, uid: string, hideType?: string }) {
    const { opened, setOpen } = props.env;
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
                if (opened.has(props.uid)) {
                    return <>
                        <div style={{ whiteSpace: "pre-wrap" }}>{d}</div>
                        <Button onClick={() => setOpen(props.uid, OpenerMode.Close)}>Hide lines</Button>
                    </>
                } else {
                    return <>
                        <div style={{ whiteSpace: "pre-wrap" }}>{lines.slice(0, 3).join("\n")} ...</div>
                        <Button onClick={() => setOpen(props.uid, OpenerMode.Open)}>Show {lines.length} lines</Button>
                    </>
                }
            }
        }
    }

    // TODO: Remove "Html" in future version
    if ((d._type === "Html" || d._type === "$html") && d.html) {
        return <div>{parse(d.html)}</div>;
    }

    // TODO: Remove "Blob" in future version
    if ((d._type === "Blob" || d._type === "$blob") && IMAGE_MIME_TYPES.includes(d.mime_type)) {
        const data = `data:${d.mime_type};base64, ${d.data}`;
        // eslint-disable-next-line jsx-a11y/alt-text
        return <div><img src={data} /></div>
    }

    if ((d._type === "$traceback")) {
        return <Traceback env={props.env} frames={d.frames} uid={props.uid} />
    }

    const children = [];
    let type = null;
    for (const property in d) {
        const value = d[property];
        if (property === "_type") {
            type = value;
            continue;
        }
        children.push({ property, value });
    }

    const isLong = children.length > 3;

    if (isLong && !opened.has(props.uid)) {
        return <>
            {(props.hideType !== type && type) && <span>{type}</span>}
            <Button onClick={() => setOpen(props.uid, OpenerMode.Open)}>Show {children.length} items</Button>
        </>
    }

    return (<>
        {(props.hideType !== type && type) && <span>{type}</span>}
        {isLong && <Button onClick={() => setOpen(props.uid, OpenerMode.Close)}>Hide items</Button>}
        <ul style={{ paddingTop: 0, paddingBottom: 0, margin: 0, paddingLeft: 25 }}>
            {children.map(({ property, value }) => <li style={{ padding: 0, margin: 0 }} key={property}><strong>{property}</strong>: <DataRenderer uid={props.uid + "/" + property} data={value} env={props.env} /></li>)}
        </ul></>);
}