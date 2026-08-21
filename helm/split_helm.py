import os
import shutil

base_dir = r"c:\Users\hazra\OneDrive\Desktop\Grocery-app\helm"
src_chart = os.path.join(base_dir, "grocery-app")

services = {
    "auth-service": "authService",
    "product-service": "productService",
    "order-service": "orderService",
    "api-gateway": "apiGateway",
    "frontend": "frontend",
    "admin": "admin",
    "vendor": "vendor",
    "delivery-partner": "deliveryPartner",
    "mongodb": "mongodb",
    "redis": "redis"
}

with open(os.path.join(src_chart, "values.yaml"), "r", encoding="utf-8") as f:
    values_content = f.read()

# 1. Create Platform Chart
platform_dir = os.path.join(base_dir, "grocery-platform")
os.makedirs(os.path.join(platform_dir, "templates"), exist_ok=True)
with open(os.path.join(platform_dir, "Chart.yaml"), "w", encoding="utf-8") as f:
    f.write("apiVersion: v2\nname: grocery-platform\ndescription: Platform resources (Istio, NetworkPolicies, Secrets)\ntype: application\nversion: 1.0.0\n")

for f in ["istio-gateway.yaml", "istio-virtualservice.yaml", "istio-destination-rules.yaml", "networkpolicy.yaml", "secrets.yaml"]:
    src_file = os.path.join(src_chart, "templates", f)
    if os.path.exists(src_file):
        shutil.copy(src_file, os.path.join(platform_dir, "templates", f))
shutil.copy(os.path.join(src_chart, "templates", "_helpers.tpl"), os.path.join(platform_dir, "templates", "_helpers.tpl"))

with open(os.path.join(platform_dir, "values.yaml"), "w", encoding="utf-8") as f:
    f.write("global:\n  domain: grocery.example.com\nistio:\n  enabled: true\nsecrets:\n  jwtSecret: CHANGE_ME\nnetworkPolicy:\n  enabled: true\n")
    
# 2. Create Service Charts
for svc, camel in services.items():
    svc_dir = os.path.join(base_dir, svc)
    os.makedirs(os.path.join(svc_dir, "templates"), exist_ok=True)
    
    with open(os.path.join(svc_dir, "Chart.yaml"), "w", encoding="utf-8") as f:
        f.write(f"apiVersion: v2\nname: {svc}\ndescription: Helm chart for {svc}\ntype: application\nversion: 1.0.0\n")
        
    src_templates = os.path.join(src_chart, "templates", svc)
    if os.path.exists(src_templates):
        for t in os.listdir(src_templates):
            t_path = os.path.join(src_templates, t)
            if os.path.isfile(t_path):
                with open(t_path, "r", encoding="utf-8") as tf:
                    content = tf.read()
                
                content = content.replace(f".Values.{camel}.", ".Values.")
                content = content.replace(f"if .Values.{camel}.enabled", "if .Values.enabled")
                content = content.replace(f"with .Values.{camel}.", "with .Values.")
                
                with open(os.path.join(svc_dir, "templates", t), "w", encoding="utf-8") as tf:
                    tf.write(content)
                    
    shutil.copy(os.path.join(src_chart, "templates", "_helpers.tpl"), os.path.join(svc_dir, "templates", "_helpers.tpl"))
    
    # Extract values block
    start_str = f"\n{camel}:"
    start_idx = values_content.find(start_str)
    if start_idx != -1:
        end_idx = len(values_content)
        for i in range(start_idx + len(start_str), len(values_content)):
            if values_content[i] == '\n' and i+1 < len(values_content) and values_content[i+1].isalpha():
                end_idx = i
                break
        
        block = values_content[start_idx+len(start_str):end_idx]
        lines = block.split('\n')
        outdented = []
        for l in lines:
            if l.startswith("  "):
                outdented.append(l[2:])
            else:
                outdented.append(l)
        
        # Add global block for imagePullPolicy etc.
        outdented.insert(0, "global:\n  imagePullPolicy: IfNotPresent\n  domain: grocery.example.com\n")
        
        with open(os.path.join(svc_dir, "values.yaml"), "w", encoding="utf-8") as f:
            f.write("\n".join(outdented) + "\n")

# 3. Clean up the original chart
shutil.rmtree(src_chart)
print("Helm chart successfully split!")
