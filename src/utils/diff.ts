export interface DiffPart {
    type: 'added' | 'removed' | 'unchanged';
    value: string;
}

/**
 * Computes a line-by-line diff between two text blocks using a Longest Common Subsequence (LCS) algorithm.
 * @param oldText The original prompt content
 * @param newText The newly generated prompt content
 * @returns Array of DiffPart structures denoting unchanged, added, or removed lines
 */
export function computeLineDiff(oldText: string, newText: string): DiffPart[] {
    // Return early if either text is empty
    if (!oldText) {
        return newText.split('\n').map(line => ({ type: 'added', value: line }));
    }
    if (!newText) {
        return oldText.split('\n').map(line => ({ type: 'removed', value: line }));
    }

    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    
    const m = oldLines.length;
    const n = newLines.length;
    
    // Initialize LCS matrix
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    // Backtrack from bottom-right of matrix to build the diff array
    const diff: DiffPart[] = [];
    let i = m;
    let j = n;
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            diff.unshift({ type: 'unchanged', value: oldLines[i - 1] });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ type: 'added', value: newLines[j - 1] });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            diff.unshift({ type: 'removed', value: oldLines[i - 1] });
            i--;
        }
    }
    
    return diff;
}
