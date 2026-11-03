from PIL import Image
from math import sin, cos, pi, exp
from pathlib import Path

p = Path(__file__).parent
src = Image.open(p/'criatura_2_transparente.png').convert('RGBA')
src.thumbnail((768, 960), Image.Resampling.LANCZOS)
w,h = src.size

def gauss(x,y,cx,cy,sx,sy):
    return exp(-0.5*((x-cx)/sx)**2 - 0.5*((y-cy)/sy)**2)

def source_point(x,y,t):
    u,v=x/w,y/h
    phase=(1-cos(2*pi*t))/2
    breath=sin(2*pi*t)
    # Weak organic displacement; lower jaw and claws receive local warps.
    dy=3.0*breath*gauss(u,v,.50,.35,.38,.28)
    dy+=4.0*phase*gauss(u,v,.175,.315,.060,.050)
    dx=2.0*breath*gauss(u,v,.50,.35,.35,.25)
    for cx,cy in ((.18,.87),(.15,.69),(.76,.73)):
        g=gauss(u,v,cx,cy,.080,.080)
        dx+=-7.0*phase*((u-cx)/.08)*g
        dy+=-2.2*phase*g
    return (x-dx,y-dy)

frames=[]
step=16
for n in range(45):
    t=n/45
    mesh=[]
    for y in range(0,h,step):
        for x in range(0,w,step):
            x1=min(x+step,w); y1=min(y+step,h)
            points=[source_point(x,y,t),source_point(x,y1,t),source_point(x1,y1,t),source_point(x1,y,t)]
            mesh.append(((x,y,x1,y1),tuple(v for pt in points for v in pt)))
    frames.append(src.transform((w,h),Image.Transform.MESH,mesh,resample=Image.Resampling.BICUBIC))
frames[0].save(p/'criatura_standby.webp',save_all=True,append_images=frames[1:],duration=[67 if i%3!=1 else 66 for i in range(45)],loop=0,lossless=True,method=4)
print('frames',len(frames),'size',w,h,'duration_ms',3000)
