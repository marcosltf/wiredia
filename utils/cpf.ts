export function cleanCPF(cpf: string): string {
    return (cpf || "").replace(/\D/g, "");
  }
  
  function eSequencia(cpf: string): boolean {
    return /^(\d)\1{10}$/.test(cpf); // 11 dígitos iguais
  }
  
  export function eValido(cpf: string): boolean {
    const c = cleanCPF(cpf);
  
    if (c.length !== 11) return false;
    if (eSequencia(c)) return false;
  
    const nums = c.split("").map(d => Number(d));
  
    // calcula o primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += nums[i] * (10 - i);
    let dv1 = (sum * 10) % 11;
    if (dv1 === 10) dv1 = 0;
    if (dv1 !== nums[9]) return false;
  
    // calcula o segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) sum += nums[i] * (11 - i);
    let dv2 = (sum * 10) % 11;
    if (dv2 === 10) dv2 = 0;
    if (dv2 !== nums[10]) return false;
  
    return true;
  }
  
  export function formatCPF(cpf: string): string {
    const c = cleanCPF(cpf);
    if (c.length !== 11) return c;
    return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6,9)}-${c.slice(9,11)}`;
  }
  