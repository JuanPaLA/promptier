export interface FooterProps {
    charsLength: number
    wordCount: number
    tokenCount?: number
}

export function Footer({ charsLength, wordCount, tokenCount }: FooterProps) {
    return (
        <div>
            {charsLength}
            {wordCount}
            {tokenCount}
        </div>
    )
}